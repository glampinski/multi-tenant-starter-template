'use client';

import { useUser } from '@stackframe/stack';
import { ROLE_PERMISSIONS, ROLES, type Role, type Permission } from '@/lib/permissions';

export function useRolePermissions() {
  const user = useUser(); // Remove 'redirect' to prevent conditional behavior
  
  const getUserRole = (teamId: string): Role | null => {
    if (!user) return null;
    
    const team = user.useTeam(teamId);
    if (!team) return null;
    
    // For demo purposes, we'll use team name prefixes to determine roles
    // In production, you'd store this in your database or team metadata
    const teamName = team.displayName.toLowerCase();
    
    // Check team name prefixes for role determination
    if (teamName.includes('superadmin') || teamName.startsWith('superadmin-')) {
      return ROLES.SUPER_ADMIN;
    }
    
    if (teamName.includes('admin') || teamName.startsWith('admin-')) {
      return ROLES.ADMIN;
    }
    
    if (teamName.includes('employee') || teamName.startsWith('employee-')) {
      return ROLES.EMPLOYEE;
    }
    
    if (teamName.includes('sales') || teamName.startsWith('sales-')) {
      return ROLES.SALES_PERSON;
    }
    
    if (teamName.includes('customer') || teamName.startsWith('customer-')) {
      return ROLES.CUSTOMER;
    }
    
    // Default to customer role
    return ROLES.CUSTOMER;
  };
  
  const hasPermission = (teamId: string, permission: Permission): boolean => {
    const role = getUserRole(teamId);
    if (!role) return false;
    
    const permissions = ROLE_PERMISSIONS[role] as readonly Permission[];
    return permissions?.includes(permission) || false;
  };
  
  const canViewData = (teamId: string, dataOwnerId?: string): boolean => {
    if (!user) return false;
    
    const role = getUserRole(teamId);
    
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return true; // Can see everything
      case ROLES.EMPLOYEE:
        // Can see data assigned by super admin (implement your logic)
        return true;
      case ROLES.SALES_PERSON:
        // Can see own customers and sales
        return dataOwnerId === user.id || dataOwnerId === undefined;
      case ROLES.CUSTOMER:
        // Can see own data only
        return dataOwnerId === user.id || dataOwnerId === undefined;
      default:
        return false;
    }
  };
  
  const canInviteUsers = (teamId: string): boolean => {
    const role = getUserRole(teamId);
    return role === ROLES.SUPER_ADMIN || 
           role === ROLES.SALES_PERSON || 
           role === ROLES.CUSTOMER;
  };
  
  const getInviteRoleOptions = (teamId: string): Role[] => {
    const role = getUserRole(teamId);
    
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return [ROLES.SUPER_ADMIN, ROLES.EMPLOYEE, ROLES.SALES_PERSON, ROLES.CUSTOMER];
      case ROLES.SALES_PERSON:
        return [ROLES.CUSTOMER]; // Can only invite customers
      case ROLES.CUSTOMER:
        return [ROLES.CUSTOMER]; // Can only invite other customers
      default:
        return [];
    }
  };
  
  return {
    getUserRole,
    hasPermission,
    canViewData,
    canInviteUsers,
    getInviteRoleOptions,
    currentUser: user
  };
}
