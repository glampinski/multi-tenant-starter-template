'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  actualValue?: number;
  createdAt: string;
}

export default function MyCustomersPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const { hasPermission, currentUser } = useRolePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  if (!teamId || !hasPermission(teamId, PERMISSIONS.VIEW_OWN_CUSTOMERS)) {
    redirect(`/dashboard/${teamId || ''}`);
  }

  useEffect(() => {
    loadCustomers();
  }, [user.id]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers?salesPersonId=${user.id}&limit=100`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedCustomers: Customer[] = data.customers.map((customer: any) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        actualValue: customer.actualValue || 0,
        createdAt: customer.createdAt,
      }));

      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      // Show empty state on error
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.actualValue || 0), 0);
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading customers...</p>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No customers found. Start inviting customers to see them here.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer: Customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 font-medium">{customer.firstName} {customer.lastName}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{customer.email}</td>
                      <td className="p-2">${(customer.actualValue || 0).toLocaleString()}</td>
                      <td className="p-2">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
