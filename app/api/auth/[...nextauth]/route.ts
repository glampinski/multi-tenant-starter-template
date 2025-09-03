import NextAuth, { type NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { nextAuthPrisma } from "@/lib/nextauth-prisma"
import { prisma } from "@/lib/prisma"
import type { Adapter } from "next-auth/adapters"
import { sendVerificationRequest } from "@/lib/email"

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
      console.log('📝 Session callback:', { 
        email: session.user?.email, 
        userId: user?.id 
      });
      
      try {
        if (session.user?.email) {
          // Try to find user profile
          const userProfile = await prisma.userProfile.findFirst({
            where: { email: session.user.email },
          });
          
          if (userProfile) {
            console.log('👤 Found user profile:', { 
              id: userProfile.id, 
              role: userProfile.role 
            });
            session.user.id = userProfile.id;
            session.user.role = userProfile.role;
          } else {
            console.log('⚠️ No user profile found for:', session.user.email);
          }
        }
      } catch (error) {
        console.error('❌ Session callback error:', error);
      }
      
      return session;
    },
    async jwt({ token, user }) {
      console.log('🔑 JWT callback:', { 
        tokenSub: token?.sub, 
        userId: user?.id 
      });
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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
