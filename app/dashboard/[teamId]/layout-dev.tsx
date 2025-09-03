'use client';

import { RoleBasedSidebar } from "@/components/role-based-sidebar";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useUser } from "@stackframe/stack";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Custom hook for development authentication
function useDevAuth() {
  const [devUser, setDevUser] = useState<any>(null);
  const [devTeam, setDevTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ teamId: string }>();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Check for development session
      const devSession = document.cookie
        .split('; ')
        .find(row => row.startsWith('dev_session='));
      
      if (devSession) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(devSession.split('=')[1]));
          
          if (sessionData.isDev && sessionData.exp > Date.now()) {
            // Create mock user and team objects
            const mockUser = {
              id: sessionData.userId,
              email: sessionData.email,
              displayName: `${sessionData.firstName} ${sessionData.lastName}`,
              primaryEmail: sessionData.email,
              primaryEmailVerified: true,
              selectedTeamId: sessionData.teamId,
              signedUpAtMillis: Date.now() - (30 * 24 * 60 * 60 * 1000),
              clientReadOnlyMetadata: {},
              clientMetadata: {},
              serverMetadata: { role: sessionData.role },
              hasPassword: true,
              oauthProviders: [],
              connectedAccounts: [],
              role: sessionData.role,
              teamId: sessionData.teamId,
              isDev: true
            };

            const mockTeam = {
              id: params.teamId,
              displayName: 'Test Company',
              profileImageUrl: null,
              createdAtMillis: Date.now() - (30 * 24 * 60 * 60 * 1000),
              clientMetadata: {},
              serverMetadata: {},
            };

            setDevUser(mockUser);
            setDevTeam(mockTeam);
          }
        } catch (error) {
          console.error('Error parsing dev session:', error);
        }
      }
    }
    setLoading(false);
  }, [params.teamId]);

  return { devUser, devTeam, loading };
}

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { devUser, devTeam, loading: devLoading } = useDevAuth();

  // Use Stack Auth only if not in dev mode or no dev session
  const stackUser = useUser({ 
    or: devUser ? undefined : 'redirect' 
  });
  
  const stackTeam = stackUser?.useTeam(params.teamId);

  // Determine which user/team to use
  const user = devUser || stackUser;
  const team = devTeam || stackTeam;

  useEffect(() => {
    if (!devLoading && !user) {
      router.push('/dev-login');
    } else if (!devLoading && user && !team) {
      router.push('/dashboard');
    }
  }, [user, team, router, devLoading]);

  if (devLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ImpersonationBanner />
      <RoleBasedSidebar>
        {props.children}
      </RoleBasedSidebar>
    </>
  );
}
