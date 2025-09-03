'use client';

import { useRolePermissions, getRoleDisplayName } from '@/hooks/useRolePermissions';
import { PERMISSIONS } from '@/lib/sidebar-permissions';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  CheckSquare, 
  Settings,
  Building,
  DollarSign,
  Share2,
  FileText,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: { module: string; action: string };
}

interface RoleBasedSidebarProps {
  children: React.ReactNode;
  user?: any;
  team?: any;
}

export function RoleBasedSidebar({ children, user: propUser, team: propTeam }: RoleBasedSidebarProps) {
  const params = useParams<{ teamId: string }>();
  const pathname = usePathname();
  const { hasPermission, getUserRole } = useRolePermissions(propUser, propTeam);
  
  // Use props if provided
  const user = propUser;
  const team = propTeam;
  
  const teamId = params?.teamId;
  
  if (!team || !teamId || !user) {
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
    if (role === 'SUPER_ADMIN') {
      return [
        ...baseItems,
        {
          title: "All Users",
          href: `/dashboard/${teamId}/users`,
          icon: Users
        },
        {
          title: "All Sales",
          href: `/dashboard/${teamId}/all-sales`,
          icon: TrendingUp
        },
        {
          title: "All Customers",
          href: `/dashboard/${teamId}/all-customers`,
          icon: UserCheck
        },
        {
          title: "Company Analytics",
          href: `/dashboard/${teamId}/analytics`,
          icon: Building
        },
        {
          title: "System Configuration",
          href: `/dashboard/${teamId}/configuration`,
          icon: Settings
        },
        {
          title: "Global Referrals",
          href: `/dashboard/${teamId}/referrals`,
          icon: Share2
        },
        {
          title: "Development Roadmap",
          href: `/dashboard/${teamId}/roadmap`,
          icon: FileText
        }
      ];
    }
    
    // Admin can manage company users  
    if (role === 'ADMIN') {
      return [
        ...baseItems,
        {
          title: "Company Users",
          href: `/dashboard/${teamId}/company-users`,
          icon: Users
        },
        {
          title: "Company Sales",
          href: `/dashboard/${teamId}/company-sales`,
          icon: TrendingUp
        },
        {
          title: "Company Customers",
          href: `/dashboard/${teamId}/company-customers`,
          icon: UserCheck
        },
        {
          title: "Company Settings",
          href: `/dashboard/${teamId}/settings`,
          icon: Settings
        },
        {
          title: "Invite Users",
          href: `/dashboard/${teamId}/invite`,
          icon: UserPlus
        },
        {
          title: "Company Analytics",
          href: `/dashboard/${teamId}/analytics`,
          icon: Building
        },
        {
          title: "Team Referrals",
          href: `/dashboard/${teamId}/referrals`,
          icon: Share2
        }
      ];
    }
    
    // Employee has limited management access
    if (role === 'EMPLOYEE') {
      return [
        ...baseItems,
        {
          title: "Assigned Tasks",
          href: `/dashboard/${teamId}/tasks`,
          icon: CheckSquare
        },
        {
          title: "My Data",
          href: `/dashboard/${teamId}/my-data`,
          icon: FileText
        }
      ];
    }
    
    // Customer has basic access
    return [
      ...baseItems,
      {
        title: "My Account",
        href: `/dashboard/${teamId}/account`,
        icon: Users
      },
      {
        title: "My Purchases",
        href: `/dashboard/${teamId}/purchases`,
        icon: ShoppingCart
      },
      {
        title: "My Referrals",
        href: `/dashboard/${teamId}/referrals`,
        icon: Share2
      },
      {
        title: "Invite Friends",
        href: `/dashboard/${teamId}/invite`,
        icon: UserPlus
      }
    ];
  };  const navigationItems = getNavigationItems();
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {team.displayName}
          </div>
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
