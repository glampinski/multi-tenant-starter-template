import { PrismaClient, UserRole } from '@prisma/client';
import { MODULES, ACTIONS, ROLES, type ModuleType, type ActionType } from '../types/permissions';

const prisma = new PrismaClient();

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  teamId: string,
  module: ModuleType,
  action: ActionType
): Promise<boolean> {
  try {
    // Get user's role
    const userProfile = await prisma.userProfile.findUnique({
      where: { stackUserId: userId }
    });

    if (!userProfile) return false;

    // Super admin always has all permissions
    if (userProfile.role === UserRole.SUPER_ADMIN) return true;

    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: {
        module_action: {
          module,
          action
        }
      }
    });

    if (!permission) return false;

    // Check for explicit user permission override
    const userPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId_teamId: {
          userId,
          permissionId: permission.id,
          teamId
        }
      }
    });

    // If explicitly denied, return false
    if (userPermission && !userPermission.granted) return false;

    // If explicitly granted, return true
    if (userPermission && userPermission.granted) return true;

    // Check role-based permission
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        role_permissionId_teamId: {
          role: userProfile.role,
          permissionId: permission.id,
          teamId
        }
      }
    });

    return !!rolePermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string, teamId: string) {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { stackUserId: userId }
    });

    if (!userProfile) return { rolePermissions: [], customPermissions: [], deniedPermissions: [] };

    // Super admin gets all permissions
    if (userProfile.role === UserRole.SUPER_ADMIN) {
      const allPermissions = await prisma.permission.findMany();
      return {
        rolePermissions: allPermissions,
        customPermissions: [],
        deniedPermissions: []
      };
    }

    // Get role-based permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: userProfile.role,
        teamId
      },
      include: {
        permission: true
      }
    });

    // Get user-specific permission overrides
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        teamId
      },
      include: {
        permission: true
      }
    });

    const customPermissions = userPermissions
      .filter(up => up.granted)
      .map(up => up.permission);

    const deniedPermissions = userPermissions
      .filter(up => !up.granted)
      .map(up => up.permission);

    return {
      rolePermissions: rolePermissions.map(rp => rp.permission),
      customPermissions,
      deniedPermissions
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { rolePermissions: [], customPermissions: [], deniedPermissions: [] };
  }
}

/**
 * Grant a permission to a user
 */
export async function grantPermission(
  userId: string,
  teamId: string,
  module: ModuleType,
  action: ActionType
): Promise<boolean> {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        module_action: {
          module,
          action
        }
      }
    });

    if (!permission) return false;

    await prisma.userPermission.upsert({
      where: {
        userId_permissionId_teamId: {
          userId,
          permissionId: permission.id,
          teamId
        }
      },
      update: {
        granted: true
      },
      create: {
        userId,
        permissionId: permission.id,
        teamId,
        granted: true
      }
    });

    return true;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

/**
 * Revoke a permission from a user
 */
export async function revokePermission(
  userId: string,
  teamId: string,
  module: ModuleType,
  action: ActionType
): Promise<boolean> {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        module_action: {
          module,
          action
        }
      }
    });

    if (!permission) return false;

    await prisma.userPermission.upsert({
      where: {
        userId_permissionId_teamId: {
          userId,
          permissionId: permission.id,
          teamId
        }
      },
      update: {
        granted: false
      },
      create: {
        userId,
        permissionId: permission.id,
        teamId,
        granted: false
      }
    });

    return true;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

/**
 * Set role permissions for a team
 */
export async function setRolePermissions(
  role: UserRole,
  teamId: string,
  permissions: Array<{ module: ModuleType; action: ActionType }>
): Promise<boolean> {
  try {
    // Remove existing role permissions for this team
    await prisma.rolePermission.deleteMany({
      where: {
        role,
        teamId
      }
    });

    // Add new permissions
    for (const { module, action } of permissions) {
      const permission = await prisma.permission.findUnique({
        where: {
          module_action: {
            module,
            action
          }
        }
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            role,
            permissionId: permission.id,
            teamId
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting role permissions:', error);
    return false;
  }
}

/**
 * Get all permissions for a role in a team
 */
export async function getRolePermissions(role: UserRole, teamId: string) {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role,
        teamId
      },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission);
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return [];
  }
}

/**
 * Check if a user can impersonate another user
 */
export async function canImpersonate(
  impersonatorId: string,
  targetUserId: string,
  teamId: string
): Promise<boolean> {
  try {
    // Check if impersonator has impersonation permission
    const hasImpersonationPermission = await hasPermission(
      impersonatorId,
      teamId,
      MODULES.TEAM_MANAGEMENT,
      ACTIONS.IMPERSONATE
    );

    if (!hasImpersonationPermission) return false;

    // Get both user profiles
    const [impersonator, target] = await Promise.all([
      prisma.userProfile.findUnique({ where: { stackUserId: impersonatorId } }),
      prisma.userProfile.findUnique({ where: { stackUserId: targetUserId } })
    ]);

    if (!impersonator || !target) return false;

    // Super admin can impersonate anyone
    if (impersonator.role === UserRole.SUPER_ADMIN) return true;

    // Admin can impersonate employees, sales people, and customers
    if (impersonator.role === UserRole.ADMIN) {
      return [UserRole.EMPLOYEE, UserRole.SALES_PERSON, UserRole.CUSTOMER].includes(target.role);
    }

    // Employee can impersonate sales people and customers
    if (impersonator.role === UserRole.EMPLOYEE) {
      return [UserRole.SALES_PERSON, UserRole.CUSTOMER].includes(target.role);
    }

    return false;
  } catch (error) {
    console.error('Error checking impersonation permission:', error);
    return false;
  }
}

// Legacy compatibility - keep old functions for existing code
export const LEGACY_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee', 
  SALES_PERSON: 'sales_person',
  CUSTOMER: 'customer'
} as const;

export const LEGACY_PERMISSIONS = {
  VIEW_ALL_DATA: 'view_all_data',
  MANAGE_ALL_USERS: 'manage_all_users',
  CONFIGURE_SYSTEM: 'configure_system',
  MANAGE_COMPANY_USERS: 'manage_company_users',
  VIEW_COMPANY_DATA: 'view_company_data',
  CONFIGURE_COMPANY: 'configure_company',
  VIEW_ASSIGNED_DATA: 'view_assigned_data',
  VIEW_OWN_CUSTOMERS: 'view_own_customers',
  VIEW_OWN_SALES: 'view_own_sales',
  INVITE_CUSTOMERS: 'invite_customers',
  VIEW_OWN_DASHBOARD: 'view_own_dashboard',
  INVITE_OTHER_CUSTOMERS: 'invite_other_customers'
} as const;

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'SUPER_ADMIN':
      return '🔑 Super Admin';
    case 'admin':
    case 'ADMIN':
      return '⚡ Admin';
    case 'employee':
    case 'EMPLOYEE':
      return '👤 Employee';
    case 'sales_person':
    case 'SALES_PERSON':
      return '💼 Salesperson';
    case 'customer':
    case 'CUSTOMER':
      return '🛒 Customer';
    default:
      return 'Unknown Role';
  }
}

export function getRoleDescription(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'SUPER_ADMIN':
      return 'Full access to all data, users, and system configuration';
    case 'admin':
    case 'ADMIN':
      return 'Manage company users, view company data, configure company settings';
    case 'employee':
    case 'EMPLOYEE':
      return 'Access to assigned data and tasks only';
    case 'sales_person':
    case 'SALES_PERSON':
      return 'View own customers and sales, can invite customers';
    case 'customer':
    case 'CUSTOMER':
      return 'Basic dashboard access, can invite other customers';
    default:
      return 'No description available';
  }
}

export { prisma };
