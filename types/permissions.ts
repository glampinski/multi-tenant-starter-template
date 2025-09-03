// Permission system types
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  userId: string;
  teamId: string;
  rolePermissions: Permission[];
  customPermissions: Permission[];
  deniedPermissions: Permission[]; // Explicitly denied permissions
}

// Modules available in the system
export const MODULES = {
  CUSTOMERS: 'customers',
  SALES: 'sales',
  REFERRALS: 'referrals',
  ANALYTICS: 'analytics',
  TEAM_MANAGEMENT: 'team_management',
  BILLING: 'billing',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard'
} as const;

// Actions that can be performed
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  ASSIGN: 'assign',
  EXPORT: 'export',
  IMPERSONATE: 'impersonate',
  MANAGE: 'manage'
} as const;

// User roles from Prisma
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  SALES_PERSON: 'SALES_PERSON',
  CUSTOMER: 'CUSTOMER'
} as const;

export type ModuleType = typeof MODULES[keyof typeof MODULES];
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
export type RoleType = typeof ROLES[keyof typeof ROLES];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleType, Array<{ module: ModuleType; action: ActionType }>> = {
  SUPER_ADMIN: [
    // Super admin has access to everything
    { module: MODULES.CUSTOMERS, action: ACTIONS.VIEW },
    { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EDIT },
    { module: MODULES.CUSTOMERS, action: ACTIONS.DELETE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.ASSIGN },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EXPORT },
    
    { module: MODULES.SALES, action: ACTIONS.VIEW },
    { module: MODULES.SALES, action: ACTIONS.CREATE },
    { module: MODULES.SALES, action: ACTIONS.EDIT },
    { module: MODULES.SALES, action: ACTIONS.DELETE },
    { module: MODULES.SALES, action: ACTIONS.EXPORT },
    
    { module: MODULES.REFERRALS, action: ACTIONS.VIEW },
    { module: MODULES.REFERRALS, action: ACTIONS.CREATE },
    { module: MODULES.REFERRALS, action: ACTIONS.EDIT },
    { module: MODULES.REFERRALS, action: ACTIONS.DELETE },
    { module: MODULES.REFERRALS, action: ACTIONS.EXPORT },
    
    { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
    { module: MODULES.ANALYTICS, action: ACTIONS.EXPORT },
    
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.VIEW },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.CREATE },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.EDIT },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.DELETE },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.IMPERSONATE },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.MANAGE },
    
    { module: MODULES.SETTINGS, action: ACTIONS.VIEW },
    { module: MODULES.SETTINGS, action: ACTIONS.EDIT },
    { module: MODULES.SETTINGS, action: ACTIONS.MANAGE },
    
    { module: MODULES.BILLING, action: ACTIONS.VIEW },
    { module: MODULES.BILLING, action: ACTIONS.EDIT },
    { module: MODULES.BILLING, action: ACTIONS.MANAGE },
    
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW }
  ],
  
  ADMIN: [
    // Admin has most permissions except super admin functions
    { module: MODULES.CUSTOMERS, action: ACTIONS.VIEW },
    { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EDIT },
    { module: MODULES.CUSTOMERS, action: ACTIONS.DELETE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.ASSIGN },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EXPORT },
    
    { module: MODULES.SALES, action: ACTIONS.VIEW },
    { module: MODULES.SALES, action: ACTIONS.CREATE },
    { module: MODULES.SALES, action: ACTIONS.EDIT },
    { module: MODULES.SALES, action: ACTIONS.DELETE },
    { module: MODULES.SALES, action: ACTIONS.EXPORT },
    
    { module: MODULES.REFERRALS, action: ACTIONS.VIEW },
    { module: MODULES.REFERRALS, action: ACTIONS.CREATE },
    { module: MODULES.REFERRALS, action: ACTIONS.EDIT },
    { module: MODULES.REFERRALS, action: ACTIONS.EXPORT },
    
    { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
    { module: MODULES.ANALYTICS, action: ACTIONS.EXPORT },
    
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.VIEW },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.CREATE },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.EDIT },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.IMPERSONATE },
    
    { module: MODULES.SETTINGS, action: ACTIONS.VIEW },
    { module: MODULES.SETTINGS, action: ACTIONS.EDIT },
    
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW }
  ],
  
  EMPLOYEE: [
    // Employee has limited management permissions
    { module: MODULES.CUSTOMERS, action: ACTIONS.VIEW },
    { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EDIT },
    { module: MODULES.CUSTOMERS, action: ACTIONS.ASSIGN },
    
    { module: MODULES.SALES, action: ACTIONS.VIEW },
    { module: MODULES.SALES, action: ACTIONS.CREATE },
    { module: MODULES.SALES, action: ACTIONS.EDIT },
    
    { module: MODULES.REFERRALS, action: ACTIONS.VIEW },
    { module: MODULES.REFERRALS, action: ACTIONS.CREATE },
    
    { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
    
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.VIEW },
    { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.IMPERSONATE },
    
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW }
  ],
  
  SALES_PERSON: [
    // Sales person only sees their own data
    { module: MODULES.CUSTOMERS, action: ACTIONS.VIEW },
    { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE },
    { module: MODULES.CUSTOMERS, action: ACTIONS.EDIT },
    
    { module: MODULES.SALES, action: ACTIONS.VIEW },
    { module: MODULES.SALES, action: ACTIONS.CREATE },
    { module: MODULES.SALES, action: ACTIONS.EDIT },
    
    { module: MODULES.REFERRALS, action: ACTIONS.VIEW },
    { module: MODULES.REFERRALS, action: ACTIONS.CREATE },
    
    { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
    
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW }
  ],
  
  CUSTOMER: [
    // Customer has very limited access
    { module: MODULES.REFERRALS, action: ACTIONS.VIEW },
    { module: MODULES.REFERRALS, action: ACTIONS.CREATE },
    
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW }
  ]
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  [MODULES.CUSTOMERS]: {
    [ACTIONS.VIEW]: 'View customer information and lists',
    [ACTIONS.CREATE]: 'Add new customers to the system',
    [ACTIONS.EDIT]: 'Modify customer information and details',
    [ACTIONS.DELETE]: 'Remove customers from the system',
    [ACTIONS.ASSIGN]: 'Assign customers to sales personnel',
    [ACTIONS.EXPORT]: 'Export customer data and reports'
  },
  [MODULES.SALES]: {
    [ACTIONS.VIEW]: 'View sales data and activities',
    [ACTIONS.CREATE]: 'Record new sales activities and deals',
    [ACTIONS.EDIT]: 'Modify sales information and outcomes',
    [ACTIONS.DELETE]: 'Remove sales records',
    [ACTIONS.EXPORT]: 'Export sales data and reports'
  },
  [MODULES.REFERRALS]: {
    [ACTIONS.VIEW]: 'View referral trees and commission data',
    [ACTIONS.CREATE]: 'Create new referral relationships',
    [ACTIONS.EDIT]: 'Modify referral information and rewards',
    [ACTIONS.DELETE]: 'Remove referral relationships',
    [ACTIONS.EXPORT]: 'Export referral data and reports'
  },
  [MODULES.ANALYTICS]: {
    [ACTIONS.VIEW]: 'Access dashboards and analytics reports',
    [ACTIONS.EXPORT]: 'Export analytics data and charts'
  },
  [MODULES.TEAM_MANAGEMENT]: {
    [ACTIONS.VIEW]: 'View team members and organizational structure',
    [ACTIONS.CREATE]: 'Add new team members and roles',
    [ACTIONS.EDIT]: 'Modify team member information and roles',
    [ACTIONS.DELETE]: 'Remove team members',
    [ACTIONS.IMPERSONATE]: 'View the system as another user',
    [ACTIONS.MANAGE]: 'Full team management capabilities'
  },
  [MODULES.SETTINGS]: {
    [ACTIONS.VIEW]: 'View system and team settings',
    [ACTIONS.EDIT]: 'Modify system and team configurations',
    [ACTIONS.MANAGE]: 'Full settings management capabilities'
  },
  [MODULES.BILLING]: {
    [ACTIONS.VIEW]: 'View billing information and invoices',
    [ACTIONS.EDIT]: 'Modify billing settings and payment methods',
    [ACTIONS.MANAGE]: 'Full billing management capabilities'
  },
  [MODULES.DASHBOARD]: {
    [ACTIONS.VIEW]: 'Access the main dashboard interface'
  }
};
