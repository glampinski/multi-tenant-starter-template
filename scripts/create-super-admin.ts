import { PrismaClient, UserRole } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!email) {
    console.error('❌ SUPER_ADMIN_EMAIL environment variable is required');
    console.error('Add SUPER_ADMIN_EMAIL=your-email@example.com to your .env.local file');
    process.exit(1);
  }

  try {
    console.log('🔍 Checking for existing Super Admin...');

    // Check if super admin already exists in UserProfile table
    const existingProfile = await prisma.userProfile.findFirst({
      where: { email }
    });

    if (existingProfile) {
      console.log(`✅ Super Admin already exists: ${email}`);
      console.log(`👤 Profile ID: ${existingProfile.id}`);
      console.log(`🏢 Tenant: ${existingProfile.tenantId}`);
      console.log(`🏢 Team: ${existingProfile.teamId}`);
      return;
    }

    console.log('🏢 Setting up default tenant...');

    // Check if default tenant exists, create if not
    let defaultTenant = await prisma.tenant.findFirst({
      where: { slug: 'default' }
    });

    if (!defaultTenant) {
      console.log('🏗️ Creating default tenant...');
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          description: 'Default tenant for super admin',
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
          maxUsers: 1000,
          maxApiCalls: 100000,
        }
      });
      console.log(`✅ Default tenant created: ${defaultTenant.id}`);
    } else {
      console.log(`✅ Using existing tenant: ${defaultTenant.id}`);
    }

    console.log('👤 Creating Super Admin profile...');

    // Generate username from email
    const username = email.split('@')[0];
    
    // Create UserProfile with SUPER_ADMIN role using only valid fields
    const superAdminProfile = await prisma.userProfile.create({
      data: {
        username: username,
        role: UserRole.SUPER_ADMIN,
        firstName: name.split(' ')[0] || 'Super',
        lastName: name.split(' ').slice(1).join(' ') || 'Admin',
        email: email,
        tenantId: defaultTenant.id, // Multi-tenant requirement
        teamId: 'main_team', // Default team
        referralCode: `SUPER_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        inviteVerified: true, // Super admin is pre-verified
      }
    });

    console.log(`🎉 Super Admin created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🆔 Profile ID: ${superAdminProfile.id}`);
    console.log(`🏢 Tenant: ${superAdminProfile.tenantId} (${defaultTenant.name})`);
    console.log(`🏢 Team: ${superAdminProfile.teamId}`);
    console.log(`🎫 Referral Code: ${superAdminProfile.referralCode}`);
    console.log(`\n🚀 Super Admin setup complete!`);
    console.log(`🔗 You can now sign in at: http://localhost:3000/auth/signin`);
    console.log(`📧 Use the magic link that will be sent to: ${email}`);

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('✨ Super Admin creation process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Super Admin creation failed:', error);
      process.exit(1);
    });
}

export { createSuperAdmin };
