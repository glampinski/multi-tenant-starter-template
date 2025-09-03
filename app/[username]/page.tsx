import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ROLES } from '@/types/permissions';

interface Props {
  params: { username: string };
  searchParams: { role?: string };
}

export default async function UsernameReferralPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { role } = await searchParams;

  // For demo purposes, we'll validate against referral-enabled usernames
  // In production, you'd check your database for valid referral users
  const validReferralUsers = [
    { username: 'demo', role: ROLES.CUSTOMER },
    { username: 'alice', role: ROLES.CUSTOMER },
    { username: 'bob', role: ROLES.SALES_PERSON },
    { username: 'john', role: ROLES.CUSTOMER },
    { username: 'sales', role: ROLES.SALES_PERSON },
    { username: 'customer1', role: ROLES.CUSTOMER },
    { username: 'test', role: ROLES.CUSTOMER }
  ];
  
  const referralUser = validReferralUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!referralUser) {
    // Username not found or not authorized for referrals - redirect to home page
    redirect('/?error=invalid-referral-link');
  }

  // Only customers and sales people can create referral links
  if (![ROLES.CUSTOMER, ROLES.SALES_PERSON].includes(referralUser.role)) {
    redirect('/?error=referral-not-available');
  }

  // Get the current user session to see if they're already signed in
  const session = await getServerSession(authOptions);
  
  if (session) {
    // User is already signed in, redirect to dashboard with referral context
    redirect(`/dashboard?ref=${username}&referrer=${username}&type=referral`);
  } else {
    // User not signed in, redirect to customer referral signup
    const customSignUpUrl = '/signup';
    const searchParams = new URLSearchParams();
    searchParams.set('ref', username);
    searchParams.set('type', 'referral');
    searchParams.set('target_role', ROLES.CUSTOMER); // Referrals default to customer
    if (referralUser.role) {
      searchParams.set('referrer_role', referralUser.role);
    }
    
    redirect(`${customSignUpUrl}?${searchParams.toString()}`);
  }
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  
  return {
    title: `Join ${username} on our platform`,
    description: `${username} has invited you to join our platform. Sign up to get started!`,
    openGraph: {
      title: `Join ${username} on our platform`,
      description: `${username} has invited you to join our platform. Sign up to get started!`,
      url: `https://yourapp.com/${username}`,
    },
  };
}
