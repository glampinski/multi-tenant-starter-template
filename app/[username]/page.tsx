import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function UsernameReferralPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { role } = await searchParams;

  try {
    // Look up the user by their actual username
    const referralUser = await prisma.userProfile.findUnique({
      where: { 
        username: username.toLowerCase() // Find by actual username
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });
    
    if (!referralUser) {
      // Username not found - redirect to home page
      redirect('/?error=invalid-referral-link');
    }

    // Check if tenant is active
    if (referralUser.tenant.status !== 'ACTIVE') {
      redirect('/?error=tenant-inactive');
    }

    // Only customers, sales people, and super admins can create referral links
    if (referralUser.role !== UserRole.CUSTOMER && 
        referralUser.role !== UserRole.SALES_PERSON && 
        referralUser.role !== UserRole.SUPER_ADMIN) {
      redirect('/?error=referral-not-available');
    }

    // Get the current user session to see if they're already signed in
    const session = await getServerSession(authOptions);
    
    if (session) {
      // User is already signed in, redirect to dashboard with referral context
      redirect(`/dashboard?ref=${referralUser.username || referralUser.id}&referrer=${referralUser.id}&type=referral`);
    } else {
      // User not signed in, redirect to customer referral signup
      const customSignUpUrl = '/signup';
      const signUpParams = new URLSearchParams();
      signUpParams.set('ref', referralUser.username || referralUser.id);
      signUpParams.set('type', 'referral');
      signUpParams.set('target_role', UserRole.CUSTOMER); // Referrals default to customer
      if (referralUser.role) {
        signUpParams.set('referrer_role', referralUser.role);
      }
      
      redirect(`${customSignUpUrl}?${signUpParams.toString()}`);
    }
  } catch (error) {
    console.error('Error processing referral link:', error);
    redirect('/?error=system-error');
  }
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  
  try {
    const referralUser = await prisma.userProfile.findUnique({
      where: { 
        username: username.toLowerCase()
      },
      select: {
        username: true,
        firstName: true,
        lastName: true
      }
    });

    const displayName = referralUser 
      ? `${referralUser.firstName || ''} ${referralUser.lastName || ''}`.trim() || referralUser.username
      : username;

    return {
      title: `Join ${displayName} on our platform`,
      description: `${displayName} has invited you to join our platform. Sign up to get started!`,
      openGraph: {
        title: `Join ${displayName} on our platform`,
        description: `${displayName} has invited you to join our platform. Sign up to get started!`,
        url: `https://yourapp.com/${username}`,
      },
    };
  } catch (error) {
    return {
      title: `Join ${username} on our platform`,
      description: `You've been invited to join our platform. Sign up to get started!`,
    };
  }
}
