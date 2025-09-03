'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@stackframe/stack';
import { useParams } from 'next/navigation';

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  primaryEmail: string;
  role: string;
  teamId: string;
  isDev?: boolean;
}

interface AppTeam {
  id: string;
  displayName: string;
}

interface AppUserContextType {
  user: AppUser | null;
  team: AppTeam | null;
  loading: boolean;
}

const AppUserContext = createContext<AppUserContextType | undefined>(undefined);

interface AppUserProviderProps {
  children: ReactNode;
}

export function AppUserProvider({ children }: AppUserProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [team, setTeam] = useState<AppTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDevSession, setHasDevSession] = useState(false);
  const params = useParams<{ teamId: string }>();
  
  // Check for dev session first to avoid calling Stack Auth hooks unnecessarily
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const devSession = document.cookie
        .split('; ')
        .find(row => row.startsWith('dev_session='));
      
      if (devSession) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(devSession.split('=')[1]));
          if (sessionData.isDev && sessionData.exp > Date.now()) {
            setHasDevSession(true);
          }
        } catch (error) {
          console.error('Error parsing dev session:', error);
        }
      }
    }
  }, []);
  
  // Only use Stack Auth if no dev session
  const stackUser = hasDevSession ? null : useUser();
  const stackTeam = stackUser?.useTeam(params?.teamId);

  useEffect(() => {
    async function initializeUser() {
      // Check for development session first
      if (process.env.NODE_ENV === 'development' && hasDevSession) {
        const devSession = document.cookie
          .split('; ')
          .find(row => row.startsWith('dev_session='));
        
        if (devSession) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(devSession.split('=')[1]));
            
            if (sessionData.isDev && sessionData.exp > Date.now()) {
              const devUser: AppUser = {
                id: sessionData.userId,
                email: sessionData.email,
                displayName: `${sessionData.firstName} ${sessionData.lastName}`,
                primaryEmail: sessionData.email,
                role: sessionData.role,
                teamId: sessionData.teamId,
                isDev: true
              };

              const devTeam: AppTeam = {
                id: sessionData.teamId,
                displayName: 'Test Company'
              };

              setUser(devUser);
              setTeam(devTeam);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error parsing dev session:', error);
          }
        }
      }

      // Fall back to Stack Auth if no dev session
      if (!hasDevSession && stackUser && stackTeam && stackUser.primaryEmail) {
        const appUser: AppUser = {
          id: stackUser.id,
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName || stackUser.primaryEmail,
          primaryEmail: stackUser.primaryEmail,
          role: (stackUser as any).serverMetadata?.role || 'CUSTOMER',
          teamId: stackTeam.id
        };

        const appTeam: AppTeam = {
          id: stackTeam.id,
          displayName: stackTeam.displayName || 'Team'
        };

        setUser(appUser);
        setTeam(appTeam);
      } else if (!hasDevSession && stackUser === null) {
        // Stack Auth determined user is not logged in
        setUser(null);
        setTeam(null);
      }
      
      setLoading(false);
    }

    initializeUser();
  }, [stackUser, stackTeam, params?.teamId, hasDevSession]);

  return (
    <AppUserContext.Provider value={{ user, team, loading }}>
      {children}
    </AppUserContext.Provider>
  );
}

export function useAppUser() {
  const context = useContext(AppUserContext);
  if (context === undefined) {
    throw new Error('useAppUser must be used within an AppUserProvider');
  }
  return context;
}
