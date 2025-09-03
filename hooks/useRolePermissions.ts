'use client';

import { MODULES, ACTIONS, ROLES, DEFAULT_ROLE_PERMISSIONS, type ModuleType, type ActionType, type RoleType } from '@/types/permissions';

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

export function useRolePermissions(propUser?: any, propTeam?: any) {
  let user = propUser;
  let team = propTeam;
  
  // If no props provided, try to get from context (may not always work)
  if (!user || !team) {
    try {
      const { useAppUser } = require('@/hooks/useAppUser-simple');
      const hookResult = useAppUser();
      user = user || hookResult.user;
      team = team || hookResult.team;
    } catch (error) {
      // Hook not available in this context
    }
  }
  
  const getUserRole = (teamId: string): RoleType | null => {
    if (!user || !team || team.id !== teamId) return null;
    
    // For development session or if user has role property, use it directly
    if (user.role) {
      return user.role as RoleType;
    }
    
    // For Stack Auth users, check team metadata or use defaults
    // For demo purposes, we'll use team name prefixes to determine roles
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
  
  const hasPermission = (teamId: string, module: ModuleType, action: ActionType): boolean => {
    const role = getUserRole(teamId);
    if (!role) return false;
    
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
    return rolePermissions.some(p => p.module === module && p.action === action);
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
  
  const getInviteRoleOptions = (teamId: string): RoleType[] => {
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
