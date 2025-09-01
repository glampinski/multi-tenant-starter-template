'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Target, Shield, Eye } from 'lucide-react';

interface SalesData {
  id: string;
  salesperson: string;
  email: string;
  customers: number;
  monthlyRevenue: number;
  targetProgress: number;
  lastSale: string;
  status: 'active' | 'inactive';
}

const mockSalesData: SalesData[] = [
  {
    id: '1',
    salesperson: 'Sarah Johnson',
    email: 'sarah@company.com',
    customers: 32,
    monthlyRevenue: 18450,
    targetProgress: 78,
    lastSale: '2 hours ago',
    status: 'active'
  },
  {
    id: '2',
    salesperson: 'Emily Davis',
    email: 'emily@company.com',
    customers: 28,
    monthlyRevenue: 15230,
    targetProgress: 65,
    lastSale: '4 hours ago',
    status: 'active'
  },
  {
    id: '3',
    salesperson: 'Robert Brown',
    email: 'robert@company.com',
    customers: 19,
    monthlyRevenue: 12890,
    targetProgress: 45,
    lastSale: '1 day ago',
    status: 'active'
  },
  {
    id: '4',
    salesperson: 'Lisa White',
    email: 'lisa@company.com',
    customers: 35,
    monthlyRevenue: 22100,
    targetProgress: 85,
    lastSale: '30 minutes ago',
    status: 'active'
  }
];

export default function CompanySalesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const { hasPermission } = useRolePermissions();

  if (!teamId || !hasPermission(teamId, PERMISSIONS.VIEW_COMPANY_DATA)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to view company sales data.</p>
        </div>
      </div>
    );
  }

  const totalRevenue = mockSalesData.reduce((sum, sales) => sum + sales.monthlyRevenue, 0);
  const totalCustomers = mockSalesData.reduce((sum, sales) => sum + sales.customers, 0);
  const avgProgress = Math.round(mockSalesData.reduce((sum, sales) => sum + sales.targetProgress, 0) / mockSalesData.length);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Sales Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor all sales team performance and revenue metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSalesData.length}</div>
            <p className="text-xs text-muted-foreground">Active salespeople</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Target Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Team Performance</CardTitle>
          <CardDescription>
            Individual performance metrics for all salespeople
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSalesData.map((sales) => (
              <div
                key={sales.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {sales.salesperson.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium">{sales.salesperson}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{sales.email}</div>
                    <div className="text-xs text-gray-500">Last sale: {sales.lastSale}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{sales.customers}</div>
                    <div className="text-xs text-gray-500">Customers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">${sales.monthlyRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <div className="text-sm font-medium">{sales.targetProgress}%</div>
                      <div className={`w-16 h-2 rounded-full ${
                        sales.targetProgress >= 75 ? 'bg-green-200' : 
                        sales.targetProgress >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            sales.targetProgress >= 75 ? 'bg-green-500' : 
                            sales.targetProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(sales.targetProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Target</div>
                  </div>
                  
                  <Badge 
                    variant={sales.status === 'active' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {sales.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
