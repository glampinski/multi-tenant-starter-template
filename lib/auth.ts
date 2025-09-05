import { type NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { nextAuthPrisma } from "@/lib/nextauth-prisma"
import { prisma } from "@/lib/prisma"
import { TenantManager } from "@/lib/tenant-manager"
import type { Adapter } from "next-auth/adapters"
import { sendVerificationRequest } from "@/lib/email"
import { TenantStatus } from "@prisma/client"

// Debug environment variables
console.log('🔧 NextAuth Environment Check:');
console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Missing');
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing');
console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(nextAuthPrisma) as Adapter,
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      sendVerificationRequest,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      console.log('📝 Session callback - Building tenant-aware session:', { 
        email: session.user?.email, 
        userId: user?.id 
      });
      
      try {
        if (session.user?.email) {
          // Try to find user profile with tenant information
          const userProfile = await (prisma.userProfile.findFirst as any)({
            where: { email: session.user.email },
          });
          
          if (userProfile) {
            console.log('👤 Found user profile:', { 
              id: userProfile.id, 
              role: userProfile.role,
              tenantId: userProfile.tenantId
            });

            // Get detailed tenant information using TenantManager
            const tenantInfo = await TenantManager.getUserTenantInfo(userProfile.id);
            
            if (tenantInfo) {
              // Check if tenant is active
              if (tenantInfo.tenant.status === 'SUSPENDED' || tenantInfo.tenant.status === 'EXPIRED') {
                console.log('🚫 Tenant is suspended/expired:', tenantInfo.tenant.status);
                throw new Error(`Tenant is ${tenantInfo.tenant.status.toLowerCase()}`);
              }

              // Build tenant-aware session
              session.user.id = tenantInfo.user.id;
              session.user.role = tenantInfo.user.role;
              session.user.teamId = tenantInfo.user.teamId;
              session.user.lineagePath = tenantInfo.user.lineagePath;
              session.user.inviteVerified = tenantInfo.user.inviteVerified;
              
              // Add tenant context
              session.user.tenantId = tenantInfo.user.tenantId;
              session.user.tenant = {
                id: tenantInfo.tenant.id,
                name: tenantInfo.tenant.name,
                slug: tenantInfo.tenant.slug,
                status: tenantInfo.tenant.status,
                plan: tenantInfo.tenant.plan
              };

              // Get accessible tenants for future multi-tenant support
              session.user.accessibleTenants = await TenantManager.getUserAccessibleTenants(userProfile.id);

              console.log('✅ Tenant-aware session built:', {
                userId: session.user.id,
                role: session.user.role,
                tenantId: session.user.tenantId,
                tenantName: session.user.tenant.name,
                tenantStatus: session.user.tenant.status
              });
            } else {
              console.log('⚠️ No tenant information found for user:', userProfile.id);
              throw new Error('User has no associated tenant');
            }
          } else {
            console.log('⚠️ No user profile found for:', session.user.email);
            throw new Error('User profile not found');
          }
        }
      } catch (error) {
        console.error('❌ Session callback error:', error);
        // For security, don't return a session if there are tenant/user issues
        throw error;
      }
      
      return session;
    },
    async jwt({ token, user }) {
      console.log('🔑 JWT callback - Building tenant-aware token:', { 
        tokenSub: token?.sub, 
        userId: user?.id 
      });
      
      // If user is signing in, populate the token with tenant information
      if (user) {
        try {
          const userProfile = await (prisma.userProfile.findFirst as any)({
            where: { email: user.email },
          });
          
          if (userProfile) {
            const tenantInfo = await TenantManager.getUserTenantInfo(userProfile.id);
            
            if (tenantInfo) {
              token.id = tenantInfo.user.id;
              token.role = tenantInfo.user.role;
              token.teamId = tenantInfo.user.teamId;
              token.lineagePath = tenantInfo.user.lineagePath;
              token.inviteVerified = tenantInfo.user.inviteVerified;
              token.tenantId = tenantInfo.user.tenantId;
              token.tenant = {
                id: tenantInfo.tenant.id,
                name: tenantInfo.tenant.name,
                slug: tenantInfo.tenant.slug,
                status: tenantInfo.tenant.status,
                plan: tenantInfo.tenant.plan
              };

              console.log('✅ JWT token built with tenant context:', {
                userId: token.id,
                tenantId: token.tenantId,
                tenantStatus: token.tenant.status
              });
            }
          }
        } catch (error) {
          console.error('❌ JWT callback error:', error);
        }
      }
      
      return token;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('🚪 SignIn callback:', { 
        userEmail: user?.email, 
        accountType: account?.type 
      });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Handle role-based redirects after successful authentication
      if (url.startsWith(baseUrl)) {
        // Extract callbackUrl from the redirect URL if present
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        
        if (callbackUrl) {
          const decodedCallbackUrl = decodeURIComponent(callbackUrl);
          console.log('📍 Found callbackUrl:', decodedCallbackUrl);
          
          // For role-based redirects, we need to check user role
          // We'll intercept dashboard redirects and redirect SUPER_ADMIN to admin-panel
          if (decodedCallbackUrl.includes('/dashboard')) {
            // Get user email from the current URL context if available
            const emailParam = urlObj.searchParams.get('email');
            if (emailParam) {
              try {
                const userProfile = await prisma.userProfile.findFirst({
                  where: { email: emailParam },
                });
                
                if (userProfile?.role === 'SUPER_ADMIN') {
                  console.log('🔄 Redirecting SUPER_ADMIN to admin panel');
                  return `${baseUrl}/admin-panel`;
                }
              } catch (error) {
                console.error('❌ Error checking user role for redirect:', error);
              }
            }
          }
          
          return decodedCallbackUrl;
        }
      }
      
      // Default redirect logic
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async signIn(message) {
      console.log('📊 SignIn event:', message);
    },
    async signOut(message) {
      console.log('📊 SignOut event:', message);
    },
    async createUser(message) {
      console.log('📊 CreateUser event:', message);
    },
    async session(message) {
      console.log('📊 Session event:', { token: message.token?.sub });
    }
  },
  debug: true, // Enable NextAuth debug mode
}
