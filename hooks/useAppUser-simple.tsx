'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const params = useParams<{ teamId: string }>();

  useEffect(() => {
    async function initializeUser() {
      // Check for development session
      if (process.env.NODE_ENV === 'development') {
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

      // If no dev session, don't set anything - let Stack Auth handle it
      // in the components that need it
      setLoading(false);
    }

    initializeUser();
  }, [params?.teamId]);

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
