'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, DollarSign, Shield } from 'lucide-react'

export function RoleBasedDashboard() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;

  // Simple role detection for now
  const getRole = () => {
    // Check dev session cookie
    if (typeof window !== 'undefined') {
      const devSession = document.cookie
        .split('; ')
        .find(row => row.startsWith('dev_session='));
      
      if (devSession) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(devSession.split('=')[1]));
          return sessionData.role;
        } catch (error) {
          console.error('Error parsing dev session:', error);
        }
      }
    }
    return 'CUSTOMER';
  };

  const role = getRole();

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN': return '🔑 Super Admin'
      case 'ADMIN': return '⚡ Admin'
      case 'EMPLOYEE': return '👤 Employee'
      case 'SALES_PERSON': return '💼 Salesperson'
      case 'CUSTOMER': return '🛒 Customer'
      default: return 'Unknown Role'
    }
  };

  const getRoleDescription = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Full system access with impersonation capabilities'
      case 'ADMIN': return 'Company management with impersonation capabilities'
      case 'EMPLOYEE': return 'Limited management with impersonation capabilities'
      case 'SALES_PERSON': return 'Sales dashboard and customer management'
      case 'CUSTOMER': return 'Basic customer dashboard and referrals'
      default: return 'Unknown role permissions'
    }
  };

  const getStatCards = () => {
    const baseStats = [
      {
        title: "Team ID",
        value: teamId || 'N/A',
        description: "Current team workspace",
        icon: Users,
        color: "text-blue-600"
      },
      {
        title: "Role",
        value: getRoleDisplayName(role),
        description: getRoleDescription(role),
        icon: Shield,
        color: "text-green-600"
      }
    ];

    if (role === 'SUPER_ADMIN') {
      return [
        ...baseStats,
        {
          title: "All Users",
          value: "25",
          description: "Total users in system",
          icon: Users,
          color: "text-purple-600"
        },
        {
          title: "Total Sales",
          value: "$45,231",
          description: "All sales across teams",
          icon: TrendingUp,
          color: "text-green-600"
        },
        {
          title: "Total Revenue",
          value: "$231,549",
          description: "Total platform revenue",
          icon: DollarSign,
          color: "text-yellow-600"
        }
      ];
    }

    if (role === 'ADMIN' || role === 'EMPLOYEE') {
      return [
        ...baseStats,
        {
          title: "Team Users",
          value: "8",
          description: "Users in your team",
          icon: Users,
          color: "text-blue-600"
        },
        {
          title: "Team Sales",
          value: "$12,450",
          description: "Your team' sales",
          icon: TrendingUp,
          color: "text-green-600"
        }
      ];
    }

    if (role === 'SALES_PERSON') {
      return [
        ...baseStats,
        {
          title: "My Customers",
          value: "12",
          description: "Your assigned customers",
          icon: Users,
          color: "text-blue-600"
        },
        {
          title: "My Sales",
          value: "$3,200",
          description: "Your personal sales",
          icon: TrendingUp,
          color: "text-green-600"
        }
      ];
    }

    // Customer
    return [
      ...baseStats,
      {
        title: "My Purchases",
        value: "3",
        description: "Items purchased",
        icon: DollarSign,
        color: "text-green-600"
      },
      {
        title: "My Referrals",
        value: "2",
        description: "Friends referred",
        icon: Users,
        color: "text-blue-600"
      }
    ];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your {getRoleDisplayName(role)} dashboard
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {getRoleDisplayName(role)}
        </Badge>
      </div>

      {/* Role-specific message */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200">
          {role === 'SUPER_ADMIN' && "You have full system access. Use the sidebar to manage users, view analytics, and impersonate other users for testing."}
          {role === 'ADMIN' && "You can manage your company's users and view company-wide data. Check the sidebar for management options."}
          {role === 'EMPLOYEE' && "You have access to assigned tasks and limited company data. Your permissions are managed by administrators."}
          {role === 'SALES_PERSON' && "You can manage your customers, track your sales, and invite new customers. Use the sidebar to access your tools."}
          {role === 'CUSTOMER' && "Welcome! You can view your purchases, refer friends, and manage your account from the sidebar."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getStatCards().map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Impersonation Note for Admins */}
      {(role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EMPLOYEE') && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🎭 Impersonation Feature
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            As a {getRoleDisplayName(role)}, you can impersonate other users to test their experience. 
            Look for the impersonation selector in the top-right area of the dashboard. 
            Your admin privileges will be retained even while impersonating.
          </p>
        </div>
      )}

      {/* Development Notice */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          🛠️ Development Mode
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          You&apos;re currently logged in using the development login system. This allows you to test different user roles without setting up full authentication.
        </p>
      </div>
    </div>
  );
}
