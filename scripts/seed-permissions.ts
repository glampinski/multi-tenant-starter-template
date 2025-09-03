import { PrismaClient } from '@prisma/client';
import { 
  MODULES, 
  ACTIONS, 
  ROLES, 
  DEFAULT_ROLE_PERMISSIONS, 
  PERMISSION_DESCRIPTIONS 
} from '../types/permissions';

const prisma = new PrismaClient();

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  // Create all permissions
  const permissions = [];
  for (const module of Object.values(MODULES)) {
    for (const action of Object.values(ACTIONS)) {
      const name = `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`;
      const description = PERMISSION_DESCRIPTIONS[module]?.[action] || `${action} access for ${module}`;
      
      permissions.push({
        name,
        description,
        module,
        action
      });
    }
  }

  console.log(`📝 Creating ${permissions.length} permissions...`);
  
  // Use upsert to avoid duplicates
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        module_action: {
          module: permission.module,
          action: permission.action
        }
      },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission
    });
  }

  console.log('✅ Permissions created successfully');

  // Create default role permissions for a sample team
  // Note: In production, this would be done when teams are created
  const sampleTeamId = 'sample-team-id'; // Replace with actual team ID
  
  console.log('🔐 Setting up default role permissions...');
  
  for (const [role, rolePermissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    console.log(`Setting permissions for ${role}...`);
    
    for (const { module, action } of rolePermissions) {
      const permission = await prisma.permission.findUnique({
        where: {
          module_action: {
            module,
            action
          }
        }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId_teamId: {
              role: role as any,
              permissionId: permission.id,
              teamId: sampleTeamId
            }
          },
          update: {},
          create: {
            role: role as any,
            permissionId: permission.id,
            teamId: sampleTeamId
          }
        });
      }
    }
  }

  console.log('✅ Default role permissions set up successfully');
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Permission seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Permission seeding failed:', error);
      process.exit(1);
    });
}

export { seedPermissions };
