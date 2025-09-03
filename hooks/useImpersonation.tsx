'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserProfile } from '@prisma/client';

interface ImpersonationContextType {
  impersonatedUser: UserProfile | null;
  isImpersonating: boolean;
  startImpersonation: (user: UserProfile) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

interface ImpersonationProviderProps {
  children: ReactNode;
}

export function ImpersonationProvider({ children }: ImpersonationProviderProps) {
  const [impersonatedUser, setImpersonatedUser] = useState<UserProfile | null>(null);

  const startImpersonation = useCallback((user: UserProfile) => {
    setImpersonatedUser(user);
    
    // Store in sessionStorage for persistence across page refreshes
    sessionStorage.setItem('impersonated_user', JSON.stringify(user));
    
    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('impersonation_started', { 
      detail: { user } 
    }));
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    
    // Clear from sessionStorage
    sessionStorage.removeItem('impersonated_user');
    
    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('impersonation_stopped'));
    
    // Reload the page to reset all data
    window.location.reload();
  }, []);

  // Initialize from sessionStorage on mount
  React.useEffect(() => {
    const storedUser = sessionStorage.getItem('impersonated_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setImpersonatedUser(user);
      } catch (error) {
        console.error('Error parsing stored impersonated user:', error);
        sessionStorage.removeItem('impersonated_user');
      }
    }
  }, []);

  const value: ImpersonationContextType = {
    impersonatedUser,
    isImpersonating: !!impersonatedUser,
    startImpersonation,
    stopImpersonation
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}

// Helper hook to get the current effective user (impersonated or actual)
export function useEffectiveUser() {
  const { impersonatedUser, isImpersonating } = useImpersonation();
  
  // This would normally get the actual user from Stack Auth
  // For now, we'll return the impersonated user if impersonating
  return {
    effectiveUser: impersonatedUser,
    isImpersonating
  };
}
