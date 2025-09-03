'use client';

import { useUser } from '@stackframe/stack';
import { useImpersonation } from './useImpersonation';
import { useState, useEffect } from 'react';
import { MODULES, ACTIONS, type ModuleType, type ActionType } from '../types/permissions';
import { UserRole } from '@prisma/client';

export function useEnhancedPermissions() {
  const user = useUser();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Get the effective user (impersonated or actual)
  const effectiveUser = isImpersonating ? impersonatedUser : user;

  // Fetch permissions from the server
  const fetchPermissions = async (userId: string, teamId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/permissions/user/${userId}?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || {});
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (teamId: string, module: ModuleType, action: ActionType): boolean => {
    if (!effectiveUser) return false;
    
    // Get the user ID properly
    const effectiveUserId = 'stackUserId' in effectiveUser ? effectiveUser.stackUserId : effectiveUser.id;
    
    // When impersonating, check what the impersonated user can see
    if (isImpersonating) {
      const impersonatedKey = `${effectiveUserId}_${teamId}_${module}_${action}`;
      const impersonatedHasPermission = permissions[impersonatedKey] || false;
      
      // For viewing permissions, use impersonated user's capabilities
      if (action === ACTIONS.VIEW) {
        return impersonatedHasPermission;
      }
      
      // For actions, admin retains their capabilities
      const adminKey = `${user?.id}_${teamId}_${module}_${action}`;
      return permissions[adminKey] || false;
    }
    
    const key = `${effectiveUserId}_${teamId}_${module}_${action}`;
    return permissions[key] || false;
  };

  // Check if user can impersonate another user
  const canImpersonate = (teamId: string): boolean => {
    if (!user || isImpersonating) return false;
    return hasPermission(teamId, MODULES.TEAM_MANAGEMENT, ACTIONS.IMPERSONATE);
  };

  // Get user role from database
  const getUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const response = await fetch(`/api/users/${userId}/role`);
      if (response.ok) {
        const data = await response.json();
        return data.role;
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
    return null;
  };

  // Legacy compatibility functions
  const legacyHasPermission = (teamId: string, permission: string): boolean => {
    // Map legacy permissions to new system
    const permissionMap: { [key: string]: { module: ModuleType; action: ActionType } } = {
      'view_all_data': { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
      'manage_all_users': { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.MANAGE },
      'configure_system': { module: MODULES.SETTINGS, action: ACTIONS.MANAGE },
      'manage_company_users': { module: MODULES.TEAM_MANAGEMENT, action: ACTIONS.EDIT },
      'view_company_data': { module: MODULES.ANALYTICS, action: ACTIONS.VIEW },
      'configure_company': { module: MODULES.SETTINGS, action: ACTIONS.EDIT },
      'view_assigned_data': { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
      'view_own_customers': { module: MODULES.CUSTOMERS, action: ACTIONS.VIEW },
      'view_own_sales': { module: MODULES.SALES, action: ACTIONS.VIEW },
      'invite_customers': { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE },
      'view_own_dashboard': { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
      'invite_other_customers': { module: MODULES.CUSTOMERS, action: ACTIONS.CREATE }
    };

    const mapped = permissionMap[permission];
    if (mapped) {
      return hasPermission(teamId, mapped.module, mapped.action);
    }
    return false;
  };

  // Load permissions when user or team changes
  useEffect(() => {
    if (effectiveUser && user?.selectedTeam?.id) {
      const effectiveUserId = 'stackUserId' in effectiveUser ? effectiveUser.stackUserId : effectiveUser.id;
      fetchPermissions(effectiveUserId, user.selectedTeam.id);
    }
  }, [effectiveUser, user?.selectedTeam?.id]);

  // Also load admin permissions when impersonating
  useEffect(() => {
    if (isImpersonating && user?.selectedTeam?.id) {
      fetchPermissions(user.id, user.selectedTeam.id);
    }
  }, [isImpersonating, user?.id, user?.selectedTeam?.id]);

  return {
    hasPermission,
    canImpersonate,
    getUserRole,
    legacyHasPermission,
    loading,
    effectiveUser,
    isImpersonating,
    currentUser: user
  };
}
