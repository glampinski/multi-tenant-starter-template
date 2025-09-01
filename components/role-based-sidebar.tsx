'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS, getRoleDisplayName } from '@/lib/permissions';
import { useUser, SelectedTeamSwitcher } from '@stackframe/stack';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  CheckSquare, 
  Settings,
  Building,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface RoleBasedSidebarProps {
  children: React.ReactNode;
}

export function RoleBasedSidebar({ children }: RoleBasedSidebarProps) {
  const user = useUser({ or: 'redirect' });
  const params = useParams<{ teamId: string }>();
  const pathname = usePathname();
  const { hasPermission, getUserRole } = useRolePermissions();
  
  const teamId = params?.teamId;
  const team = teamId ? user.useTeam(teamId) : null;
  
  if (!team || !teamId) {
    return <div className="flex items-center justify-center h-screen">Please select a team</div>;
  }
  
  const role = getUserRole(teamId);
  const roleDisplayName = role ? getRoleDisplayName(role) : 'Unknown Role';
  
  const getNavigationItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      {
        title: "Dashboard",
        href: `/dashboard/${teamId}`,
        icon: LayoutDashboard
      }
    ];
    
    // Super Admin sees everything
    if (hasPermission(teamId, PERMISSIONS.VIEW_ALL_DATA)) {
      return [
        ...baseItems,
        {
          title: "All Users",
          href: `/dashboard/${teamId}/users`,
          icon: Users,
          permission: PERMISSIONS.MANAGE_ALL_USERS
        },
        {
          title: "All Sales",
          href: `/dashboard/${teamId}/all-sales`,
          icon: TrendingUp,
          permission: PERMISSIONS.VIEW_ALL_DATA
        },
        {
          title: "All Customers",
          href: `/dashboard/${teamId}/all-customers`,
          icon: UserCheck,
          permission: PERMISSIONS.VIEW_ALL_DATA
        },
        {
          title: "Company Analytics",
          href: `/dashboard/${teamId}/analytics`,
          icon: Building,
          permission: PERMISSIONS.VIEW_ALL_DATA
        },
        {
          title: "System Configuration",
          href: `/dashboard/${teamId}/configuration`,
          icon: Settings,
          permission: PERMISSIONS.CONFIGURE_SYSTEM
        }
      ];
    }

    // Admin navigation - company level access
    if (hasPermission(teamId, PERMISSIONS.MANAGE_COMPANY_USERS)) {
      return [
        ...baseItems,
        {
          title: "Company Users",
          href: `/dashboard/${teamId}/users`,
          icon: Users,
          permission: PERMISSIONS.MANAGE_COMPANY_USERS
        },
        {
          title: "Company Sales",
          href: `/dashboard/${teamId}/company-sales`,
          icon: TrendingUp,
          permission: PERMISSIONS.VIEW_COMPANY_DATA
        },
        {
          title: "Company Customers",
          href: `/dashboard/${teamId}/company-customers`,
          icon: UserCheck,
          permission: PERMISSIONS.VIEW_COMPANY_DATA
        },
        {
          title: "Company Settings",
          href: `/dashboard/${teamId}/company-settings`,
          icon: Settings,
          permission: PERMISSIONS.CONFIGURE_COMPANY
        },
        {
          title: "Invite Users",
          href: `/dashboard/${teamId}/invite`,
          icon: UserPlus,
          permission: PERMISSIONS.MANAGE_COMPANY_USERS
        }
      ];
    }

    // Salesperson navigation
    if (hasPermission(teamId, PERMISSIONS.VIEW_OWN_CUSTOMERS)) {
      return [
        ...baseItems,
        {
          title: "My Customers",
          href: `/dashboard/${teamId}/my-customers`,
          icon: UserCheck,
          permission: PERMISSIONS.VIEW_OWN_CUSTOMERS
        },
        {
          title: "My Sales",
          href: `/dashboard/${teamId}/my-sales`,
          icon: TrendingUp,
          permission: PERMISSIONS.VIEW_OWN_SALES
        },
        {
          title: "Sales Performance",
          href: `/dashboard/${teamId}/sales-performance`,
          icon: DollarSign,
          permission: PERMISSIONS.VIEW_OWN_SALES
        },
        {
          title: "Invite Customers",
          href: `/dashboard/${teamId}/invite`,
          icon: UserPlus,
          permission: PERMISSIONS.INVITE_CUSTOMERS
        }
      ];
    }
    
    // Employee navigation
    if (hasPermission(teamId, PERMISSIONS.VIEW_ASSIGNED_DATA)) {
      return [
        ...baseItems,
        {
          title: "Assigned Tasks",
          href: `/dashboard/${teamId}/tasks`,
          icon: CheckSquare,
          permission: PERMISSIONS.VIEW_ASSIGNED_DATA
        },
        {
          title: "My Projects",
          href: `/dashboard/${teamId}/projects`,
          icon: Building,
          permission: PERMISSIONS.VIEW_ASSIGNED_DATA
        }
      ];
    }
    
    // Customer navigation (minimal)
    return [
      ...baseItems,
      {
        title: "My Account",
        href: `/dashboard/${teamId}/account`,
        icon: UserCheck,
        permission: PERMISSIONS.VIEW_OWN_DASHBOARD
      },
      {
        title: "Invite Others",
        href: `/dashboard/${teamId}/invite`,
        icon: UserPlus,
        permission: PERMISSIONS.INVITE_OTHER_CUSTOMERS
      }
    ];
  };
  
  const navigationItems = getNavigationItems();
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SelectedTeamSwitcher 
            selectedTeam={team}
            urlMap={(team) => `/dashboard/${team.id}`}
          />
          <div className="mt-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {roleDisplayName}
            </span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
