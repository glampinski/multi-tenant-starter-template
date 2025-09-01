'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS, ROLES, getRoleDisplayName } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Briefcase, ShoppingCart } from 'lucide-react';

export default function AllUsersPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const { hasPermission } = useRolePermissions();
  
  if (!teamId || !hasPermission(teamId, PERMISSIONS.MANAGE_ALL_USERS)) {
    redirect(`/dashboard/${teamId || ''}`);
  }
  
  // Mock user data - in production, fetch from your API
  const allUsers = [
    { 
      id: '1', 
      name: 'Alice Johnson', 
      email: 'alice@company.com', 
      role: ROLES.SUPER_ADMIN, 
      joinedDate: '2023-01-15',
      lastActive: '2024-01-20',
      invitedBy: 'System'
    },
    { 
      id: '2', 
      name: 'Bob Smith', 
      email: 'bob@company.com', 
      role: ROLES.SALES_PERSON, 
      joinedDate: '2023-03-20',
      lastActive: '2024-01-19',
      invitedBy: 'Alice Johnson'
    },
    { 
      id: '3', 
      name: 'Carol Davis', 
      email: 'carol@company.com', 
      role: ROLES.EMPLOYEE, 
      joinedDate: '2023-05-10',
      lastActive: '2024-01-18',
      invitedBy: 'Alice Johnson'
    },
    { 
      id: '4', 
      name: 'David Wilson', 
      email: 'david@customer.com', 
      role: ROLES.CUSTOMER, 
      joinedDate: '2023-08-15',
      lastActive: '2024-01-17',
      invitedBy: 'Bob Smith'
    },
    { 
      id: '5', 
      name: 'Eva Brown', 
      email: 'eva@customer.com', 
      role: ROLES.CUSTOMER, 
      joinedDate: '2023-10-20',
      lastActive: '2024-01-16',
      invitedBy: 'Bob Smith'
    },
  ];
  
  const roleStats = {
    [ROLES.SUPER_ADMIN]: allUsers.filter(u => u.role === ROLES.SUPER_ADMIN).length,
    [ROLES.EMPLOYEE]: allUsers.filter(u => u.role === ROLES.EMPLOYEE).length,
    [ROLES.SALES_PERSON]: allUsers.filter(u => u.role === ROLES.SALES_PERSON).length,
    [ROLES.CUSTOMER]: allUsers.filter(u => u.role === ROLES.CUSTOMER).length,
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return <Shield className="h-4 w-4 text-red-600" />;
      case ROLES.SALES_PERSON:
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case ROLES.EMPLOYEE:
        return <Users className="h-4 w-4 text-green-600" />;
      case ROLES.CUSTOMER:
        return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Users</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage all users across the platform
        </p>
      </div>
      
      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats[ROLES.SUPER_ADMIN]}</div>
            <p className="text-xs text-muted-foreground">
              Full access users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales People</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats[ROLES.SALES_PERSON]}</div>
            <p className="text-xs text-muted-foreground">
              Sales team members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats[ROLES.EMPLOYEE]}</div>
            <p className="text-xs text-muted-foreground">
              Internal staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats[ROLES.CUSTOMER]}</div>
            <p className="text-xs text-muted-foreground">
              External customers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Platform Users</CardTitle>
          <CardDescription>
            Complete list of all users with their roles and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Invited By</th>
                  <th className="text-left p-2">Joined Date</th>
                  <th className="text-left p-2">Last Active</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((userData) => (
                  <tr key={userData.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{userData.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{userData.email}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(userData.role)}
                        <span className="text-sm">{getRoleDisplayName(userData.role)}</span>
                      </div>
                    </td>
                    <td className="p-2 text-sm">{userData.invitedBy}</td>
                    <td className="p-2 text-sm">{new Date(userData.joinedDate).toLocaleDateString()}</td>
                    <td className="p-2 text-sm">{new Date(userData.lastActive).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
