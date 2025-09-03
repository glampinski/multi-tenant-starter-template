import { stackServerApp } from '../stack';
import { prisma } from '../lib/permissions';

async function syncStackAuthUsers() {
  console.log('🔄 Syncing Stack Auth users with database profiles...');

  try {
    // Get all Stack Auth users
    const stackUsers = await stackServerApp.listUsers();
    console.log(`Found ${stackUsers.length} Stack Auth users`);

    for (const stackUser of stackUsers) {
      if (!stackUser.primaryEmail) continue; // Skip users without email
      
      console.log(`Processing user: ${stackUser.primaryEmail}`);

      // Check if we have a matching test user profile
      const existingProfile = await prisma.userProfile.findFirst({
        where: { email: stackUser.primaryEmail }
      });

      if (existingProfile) {
        // Update the existing profile with Stack Auth ID
        await prisma.userProfile.update({
          where: { id: existingProfile.id },
          data: {
            stackUserId: stackUser.id,
            firstName: stackUser.displayName?.split(' ')[0] || existingProfile.firstName,
            lastName: stackUser.displayName?.split(' ')[1] || existingProfile.lastName,
          }
        });
        console.log(`✅ Updated profile for ${stackUser.primaryEmail}`);
      } else {
        // Create new profile with default customer role
        await prisma.userProfile.create({
          data: {
            stackUserId: stackUser.id,
            email: stackUser.primaryEmail,
            firstName: stackUser.displayName?.split(' ')[0] || 'User',
            lastName: stackUser.displayName?.split(' ')[1] || 'Name',
            role: 'CUSTOMER',
            teamId: 'team_test_123' // Use our test team
          }
        });
        console.log(`✅ Created new profile for ${stackUser.primaryEmail}`);
      }
    }

    console.log('🎉 User sync completed successfully!');

  } catch (error) {
    console.error('❌ Error syncing users:', error);
  }
}

if (require.main === module) {
  syncStackAuthUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncStackAuthUsers };
