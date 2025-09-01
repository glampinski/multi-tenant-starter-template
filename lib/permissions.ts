export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee', 
  SALES_PERSON: 'sales_person',
  CUSTOMER: 'customer'
} as const;

export const PERMISSIONS = {
  // Super Admin permissions (highest level)
  VIEW_ALL_DATA: 'view_all_data',
  MANAGE_ALL_USERS: 'manage_all_users',
  CONFIGURE_SYSTEM: 'configure_system',
  
  // Admin permissions (second level)
  MANAGE_COMPANY_USERS: 'manage_company_users',
  VIEW_COMPANY_DATA: 'view_company_data',
  CONFIGURE_COMPANY: 'configure_company',
  
  // Employee permissions (third level)
  VIEW_ASSIGNED_DATA: 'view_assigned_data',
  
  // Sales Person permissions (fourth level)
  VIEW_OWN_CUSTOMERS: 'view_own_customers',
  VIEW_OWN_SALES: 'view_own_sales',
  INVITE_CUSTOMERS: 'invite_customers',
  
  // Customer permissions (fifth level)
  VIEW_OWN_DASHBOARD: 'view_own_dashboard',
  INVITE_OTHER_CUSTOMERS: 'invite_other_customers'
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin has all permissions
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.CONFIGURE_SYSTEM,
    PERMISSIONS.MANAGE_COMPANY_USERS,
    PERMISSIONS.VIEW_COMPANY_DATA,
    PERMISSIONS.CONFIGURE_COMPANY,
    PERMISSIONS.VIEW_ASSIGNED_DATA,
    PERMISSIONS.VIEW_OWN_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.INVITE_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_DASHBOARD,
    PERMISSIONS.INVITE_OTHER_CUSTOMERS
  ],
  [ROLES.ADMIN]: [
    // Admin has company-level permissions and below
    PERMISSIONS.MANAGE_COMPANY_USERS,
    PERMISSIONS.VIEW_COMPANY_DATA,
    PERMISSIONS.CONFIGURE_COMPANY,
    PERMISSIONS.VIEW_ASSIGNED_DATA,
    PERMISSIONS.VIEW_OWN_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.INVITE_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_DASHBOARD,
    PERMISSIONS.INVITE_OTHER_CUSTOMERS
  ],
  [ROLES.EMPLOYEE]: [
    // Employee has limited access
    PERMISSIONS.VIEW_ASSIGNED_DATA,
    PERMISSIONS.VIEW_OWN_DASHBOARD
  ],
  [ROLES.SALES_PERSON]: [
    // Sales Person has their own sales and customer permissions
    PERMISSIONS.VIEW_OWN_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.INVITE_CUSTOMERS,
    PERMISSIONS.VIEW_OWN_DASHBOARD
  ],
  [ROLES.CUSTOMER]: [
    // Customer has minimal permissions
    PERMISSIONS.VIEW_OWN_DASHBOARD,
    PERMISSIONS.INVITE_OTHER_CUSTOMERS
  ]
};

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return '🔑 Super Admin';
    case ROLES.ADMIN:
      return '⚡ Admin';
    case ROLES.EMPLOYEE:
      return '👤 Employee';
    case ROLES.SALES_PERSON:
      return '💼 Salesperson';
    case ROLES.CUSTOMER:
      return '🛒 Customer';
    default:
      return 'Unknown Role';
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Full access to all data, users, and system configuration';
    case ROLES.ADMIN:
      return 'Manage company users, view company data, configure company settings';
    case ROLES.EMPLOYEE:
      return 'Access to assigned data and tasks only';
    case ROLES.SALES_PERSON:
      return 'View own customers and sales, can invite customers';
    case ROLES.CUSTOMER:
      return 'Basic dashboard access, can invite other customers';
    default:
      return 'No description available';
  }
}
