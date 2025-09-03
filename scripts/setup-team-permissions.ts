import { setRolePermissions } from '../lib/permissions';
import { DEFAULT_ROLE_PERMISSIONS } from '../types/permissions';
import { UserRole } from '@prisma/client';

async function setupTeamPermissions() {
  const teamId = 'team_test_123';
  
  console.log('🔐 Setting up role permissions for test team...');
  
  for (const [roleStr, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = roleStr as UserRole;
    console.log(`Setting permissions for ${role}...`);
    await setRolePermissions(role, teamId, permissions);
  }
  
  console.log('✅ Team permissions set up successfully');
}

if (require.main === module) {
  setupTeamPermissions()
    .then(() => {
      console.log('🎉 Permission setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Permission setup failed:', error);
      process.exit(1);
    });
}
