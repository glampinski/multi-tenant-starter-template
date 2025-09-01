'use client';

import React, { useState } from 'react';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, getRoleDisplayName, getRoleDescription } from '@/lib/permissions';
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
  Database,
  Shield
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee' | 'sales_person' | 'customer';
}

const mockUsers: User[] = [
  { id: '1', name: 'Super Admin User', email: 'superadmin@example.com', role: 'super_admin' },
  { id: '2', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: '3', name: 'Employee User', email: 'employee@example.com', role: 'employee' },
  { id: '4', name: 'Sales Person', email: 'sales@example.com', role: 'sales_person' },
  { id: '5', name: 'Customer User', email: 'customer@example.com', role: 'customer' },
];

interface FeatureItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  description: string;
}

const allFeatures: FeatureItem[] = [
  {
    title: 'System Configuration',
    icon: Settings,
    permission: PERMISSIONS.CONFIGURE_SYSTEM,
    description: 'Configure system-wide settings and parameters'
  },
  {
    title: 'All User Management',
    icon: Shield,
    permission: PERMISSIONS.MANAGE_ALL_USERS,
    description: 'Manage all users across the entire system'
  },
  {
    title: 'Global Data Access',
    icon: Database,
    permission: PERMISSIONS.VIEW_ALL_DATA,
    description: 'View all data across the entire system'
  },
  {
    title: 'Company Users',
    icon: Users,
    permission: PERMISSIONS.MANAGE_COMPANY_USERS,
    description: 'Manage users within your company'
  },
  {
    title: 'Company Data',
    icon: Building,
    permission: PERMISSIONS.VIEW_COMPANY_DATA,
    description: 'View data within your company'
  },
  {
    title: 'Company Settings',
    icon: Settings,
    permission: PERMISSIONS.CONFIGURE_COMPANY,
    description: 'Configure company-specific settings'
  },
  {
    title: 'Assigned Tasks',
    icon: CheckSquare,
    permission: PERMISSIONS.VIEW_ASSIGNED_DATA,
    description: 'View data and tasks assigned to you'
  },
  {
    title: 'Customer Management',
    icon: UserCheck,
    permission: PERMISSIONS.VIEW_OWN_CUSTOMERS,
    description: 'Manage your assigned customers'
  },
  {
    title: 'Sales Data',
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_OWN_SALES,
    description: 'View your sales performance and data'
  },
  {
    title: 'Invite Customers',
    icon: UserPlus,
    permission: PERMISSIONS.INVITE_CUSTOMERS,
    description: 'Invite new customers to the platform'
  },
  {
    title: 'Personal Dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_OWN_DASHBOARD,
    description: 'Access your personal dashboard'
  },
  {
    title: 'Customer Referrals',
    icon: TrendingUp,
    permission: PERMISSIONS.INVITE_OTHER_CUSTOMERS,
    description: 'Invite and refer other customers'
  },
];

// Helper function to check if role has permission
function hasRolePermission(userRole: string, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission as any) || false;
}

export default function RoleDemoPage() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);

  const availableFeatures = allFeatures.filter(feature => 
    !feature.permission || hasRolePermission(currentUser.role, feature.permission)
  );

  const userPermissions = ROLE_PERMISSIONS[currentUser.role as keyof typeof ROLE_PERMISSIONS] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Multi-Tenant Role-Based System Demo
          </h1>
          <div className="flex items-center gap-4">
            <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
              Switch User Role:
            </label>
            <select
              id="user-select"
              value={currentUser.id}
              onChange={(e) => {
                const user = mockUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
            >
              {mockUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({getRoleDisplayName(user.role)})
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Currently viewing as: <span className="font-medium">{currentUser.name}</span> - {getRoleDisplayName(currentUser.role)}
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Available Features</h2>
            <p className="text-sm text-gray-500 mt-1">
              Role: {getRoleDisplayName(currentUser.role)}
            </p>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {availableFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <li key={index}>
                    <div className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <IconComponent className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {feature.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            
            {availableFeatures.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No features available for this role</p>
              </div>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">
              {getRoleDisplayName(currentUser.role)} Dashboard
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Available Features</h3>
                <p className="text-3xl font-bold text-blue-600">{availableFeatures.length}</p>
                <p className="text-sm text-gray-500">Features accessible to this role</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Role Level</h3>
                <p className="text-3xl font-bold text-green-600">
                  {Object.values(ROLES).indexOf(currentUser.role) + 1}
                </p>
                <p className="text-sm text-gray-500">Access level (1-5)</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {userPermissions.length}
                </p>
                <p className="text-sm text-gray-500">Total permissions granted</p>
              </div>
            </div>

            {/* Role Information Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Role Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Current User</h4>
                    <p className="text-gray-600">{currentUser.name} ({currentUser.email})</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Role Description</h4>
                    <p className="text-gray-600">{getRoleDescription(currentUser.role)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Granted Permissions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userPermissions.length > 0 ? (
                    userPermissions.map((permission, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">
                          {permission.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No permissions granted</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Comparison Section */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Role Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Features
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(ROLES).map((role) => {
                      const roleFeatures = allFeatures.filter(feature => 
                        !feature.permission || hasRolePermission(role, feature.permission)
                      );
                      const rolePerms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
                      const isCurrentRole = role === currentUser.role;
                      
                      return (
                        <tr key={role} className={isCurrentRole ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {getRoleDisplayName(role)}
                              </div>
                              {isCurrentRole && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Current
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {roleFeatures.length} features
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rolePerms.length} permissions
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
