'use client';

import { useUser } from '@stackframe/stack';
import { useAppUser } from '@/hooks/useAppUser-simple';
import { useParams } from 'next/navigation';

interface CombinedUser {
  id: string;
  email: string;
  displayName: string;
  primaryEmail: string;
  role: string;
  teamId: string;
  isDev?: boolean;
}

interface CombinedTeam {
  id: string;
  displayName: string;
}

export function useCombinedAuth() {
  const { user: devUser, team: devTeam, loading: devLoading } = useAppUser();
  const params = useParams<{ teamId: string }>();
  
  // Only call Stack Auth hooks if no dev user
  let stackUser = null;
  let stackTeam = null;
  let stackLoading = false;
  
  try {
    const stackUserResult = useUser();
    stackUser = stackUserResult;
    stackTeam = stackUser?.useTeam(params?.teamId) || null;
  } catch (error) {
    // Stack Auth not available or user not authenticated
    console.log('Stack Auth not available:', error);
  }

  // Determine which user/team to use
  const user: CombinedUser | null = devUser || (stackUser && stackTeam && stackUser.primaryEmail ? {
    id: stackUser.id,
    email: stackUser.primaryEmail,
    displayName: stackUser.displayName || stackUser.primaryEmail,
    primaryEmail: stackUser.primaryEmail,
    role: (stackUser as any).serverMetadata?.role || 'CUSTOMER',
    teamId: stackTeam.id
  } : null);

  const team: CombinedTeam | null = devTeam || (stackTeam ? {
    id: stackTeam.id,
    displayName: stackTeam.displayName || 'Team'
  } : null);

  const loading = devLoading || stackLoading;

  return { user, team, loading };
}
