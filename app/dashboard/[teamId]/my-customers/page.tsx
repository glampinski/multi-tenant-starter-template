'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, UserPlus } from 'lucide-react';

export default function MyCustomersPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const { hasPermission, currentUser } = useRolePermissions();
  
  if (!teamId || !hasPermission(teamId, PERMISSIONS.VIEW_OWN_CUSTOMERS)) {
    redirect(`/dashboard/${teamId || ''}`);
  }
  
  // Mock data - in production, fetch from your API
  const myCustomers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', totalSpent: 5000, joinedDate: '2024-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', totalSpent: 3200, joinedDate: '2024-02-20' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', totalSpent: 1800, joinedDate: '2024-03-10' },
  ];
  
  const totalCustomers = myCustomers.length;
  const totalRevenue = myCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const averageSpent = totalRevenue / totalCustomers || 0;
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Customers</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customers you have invited and their activity
        </p>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Customers you invited
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From your customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageSpent.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              New customers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            All customers you have invited to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Total Spent</th>
                  <th className="text-left p-2">Joined Date</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">{customer.name}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400">{customer.email}</td>
                    <td className="p-2">${customer.totalSpent.toLocaleString()}</td>
                    <td className="p-2">{new Date(customer.joinedDate).toLocaleDateString()}</td>
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
