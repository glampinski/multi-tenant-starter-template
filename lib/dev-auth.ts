import { User } from '@stackframe/stack';
import { cookies } from 'next/headers';

export interface DevUser {
  id: string;
  email: string;
  displayName: string;
  primaryEmail: string;
  primaryEmailVerified: boolean;
  profileImageUrl?: string;
  selectedTeamId?: string;
  signedUpAtMillis: number;
  clientReadOnlyMetadata: any;
  clientMetadata: any;
  serverMetadata: any;
  hasPassword: boolean;
  oauthProviders: any[];
  connectedAccounts: any[];
  // Custom dev properties
  role: string;
  teamId: string;
  isDev: true;
}

export async function getDevUser(): Promise<DevUser | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const devSessionCookie = cookieStore.get('dev_session');
    
    if (!devSessionCookie) {
      return null;
    }

    const session = JSON.parse(devSessionCookie.value);
    
    // Check if session is still valid
    if (!session.isDev || session.exp <= Date.now()) {
      return null;
    }

    // Create a mock user object that matches Stack Auth's User interface
    return {
      id: session.userId,
      email: session.email,
      displayName: `${session.firstName} ${session.lastName}`,
      primaryEmail: session.email,
      primaryEmailVerified: true,
      selectedTeamId: session.teamId,
      signedUpAtMillis: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      clientReadOnlyMetadata: {},
      clientMetadata: {},
      serverMetadata: { role: session.role },
      hasPassword: true,
      oauthProviders: [],
      connectedAccounts: [],
      // Custom properties
      role: session.role,
      teamId: session.teamId,
      isDev: true
    };
  } catch (error) {
    console.error('Error parsing dev session:', error);
    return null;
  }
}

export async function getDevTeam(teamId: string) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const devUser = await getDevUser();
  if (!devUser || devUser.teamId !== teamId) {
    return null;
  }

  return {
    id: teamId,
    displayName: 'Test Company',
    profileImageUrl: null,
    createdAtMillis: Date.now() - (30 * 24 * 60 * 60 * 1000),
    clientMetadata: {},
    serverMetadata: {},
  };
}
