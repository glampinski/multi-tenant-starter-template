'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';

export default function MySalesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const { hasPermission } = useRolePermissions();
  
  if (!teamId || !hasPermission(teamId, PERMISSIONS.VIEW_OWN_SALES)) {
    redirect(`/dashboard/${teamId || ''}`);
  }
  
  // Mock sales data - in production, fetch from your API
  const salesData = {
    thisMonth: 12500,
    lastMonth: 10200,
    thisYear: 145000,
    target: 150000,
    recentSales: [
      { id: '1', customer: 'John Doe', amount: 2500, date: '2024-01-20', product: 'Premium Package' },
      { id: '2', customer: 'Jane Smith', amount: 1800, date: '2024-01-18', product: 'Standard Package' },
      { id: '3', customer: 'Bob Johnson', amount: 3200, date: '2024-01-15', product: 'Enterprise Package' },
    ]
  };
  
  const monthlyGrowth = ((salesData.thisMonth - salesData.lastMonth) / salesData.lastMonth * 100).toFixed(1);
  const targetProgress = (salesData.thisYear / salesData.target * 100).toFixed(1);
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Sales Performance</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your personal sales metrics and performance
        </p>
      </div>
      
      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.thisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.thisYear.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Year to date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetProgress}%</div>
            <p className="text-xs text-muted-foreground">
              of ${salesData.target.toLocaleString()} target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,167</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Bar for Annual Target */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Target Progress</CardTitle>
          <CardDescription>
            Your progress towards the ${salesData.target.toLocaleString()} annual target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(Number(targetProgress), 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>$0</span>
            <span>${salesData.thisYear.toLocaleString()} / ${salesData.target.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Your latest sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">{sale.customer}</td>
                    <td className="p-2">{sale.product}</td>
                    <td className="p-2 text-green-600 font-semibold">${sale.amount.toLocaleString()}</td>
                    <td className="p-2">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Completed
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
