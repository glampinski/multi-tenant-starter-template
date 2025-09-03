// Simple permission constants for the sidebar
export const PERMISSIONS = {
  VIEW_ALL_DATA: { module: 'analytics' as const, action: 'view' as const },
  MANAGE_ALL_USERS: { module: 'team_management' as const, action: 'manage' as const },
  CONFIGURE_SYSTEM: { module: 'settings' as const, action: 'manage' as const },
  MANAGE_COMPANY_USERS: { module: 'team_management' as const, action: 'edit' as const },
  VIEW_COMPANY_DATA: { module: 'analytics' as const, action: 'view' as const },
  CONFIGURE_COMPANY: { module: 'settings' as const, action: 'edit' as const },
  VIEW_ASSIGNED_DATA: { module: 'dashboard' as const, action: 'view' as const },
  VIEW_OWN_CUSTOMERS: { module: 'customers' as const, action: 'view' as const },
  VIEW_OWN_SALES: { module: 'sales' as const, action: 'view' as const },
  INVITE_CUSTOMERS: { module: 'team_management' as const, action: 'create' as const },
  VIEW_OWN_DASHBOARD: { module: 'dashboard' as const, action: 'view' as const },
  INVITE_OTHER_CUSTOMERS: { module: 'team_management' as const, action: 'create' as const }
};
