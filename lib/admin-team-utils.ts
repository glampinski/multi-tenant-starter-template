// Example: Admin team creation utility
// You could add this to create teams for users programmatically

import { stackServerApp } from '@/stack';

export async function createTeamForUser(userId: string, teamData: {
  displayName: string;
  description?: string;
}) {
  try {
    // Get the user
    const user = await stackServerApp.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create team with Stack Auth API
    const team = await user.createTeam({
      displayName: teamData.displayName,
    });

    return {
      success: true,
      team: {
        id: team.id,
        displayName: team.displayName,
        createdAt: team.createdAt,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Example usage:
// const result = await createTeamForUser('user-id', { 
//   displayName: 'Engineering Team' 
// });
