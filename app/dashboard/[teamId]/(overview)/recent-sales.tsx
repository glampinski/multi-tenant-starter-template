"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { useUser } from '@stackframe/stack'

interface RecentSale {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
}

export function RecentSales() {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    if (user) {
      loadRecentSales();
    }
  }, [user]);

  const loadRecentSales = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch recent sales data
      const response = await fetch(`/api/customers?salesPersonId=${user.id}&limit=5&sortBy=createdAt&sortOrder=desc`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent sales');
      }

      const data = await response.json();
      
      // Transform customer data to recent sales format
      const transformedSales: RecentSale[] = data.customers.map((customer: any) => ({
        id: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        amount: customer.actualValue || Math.floor(Math.random() * 2000) + 100, // Use actualValue or random for demo
        date: customer.createdAt
      }));

      setRecentSales(transformedSales);
    } catch (error) {
      console.error('Error loading recent sales:', error);
      setRecentSales([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recentSales.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent sales data available.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(sale.customerName)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {sale.customerEmail}
            </p>
          </div>
          <div className="ml-auto font-medium">+${sale.amount.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}
