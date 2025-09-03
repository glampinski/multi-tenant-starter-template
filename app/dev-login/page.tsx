'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';

const DEV_USERS = [
  {
    id: 'user_super_admin_1',
    email: 'superadmin@example.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    description: 'Full system access with impersonation capabilities'
  },
  {
    id: 'user_admin_1',
    email: 'alice@example.com',
    name: 'Alice Manager',
    role: 'ADMIN',
    description: 'Company management with impersonation capabilities'
  },
  {
    id: 'user_employee_1',
    email: 'bob@example.com',
    name: 'Bob Worker',
    role: 'EMPLOYEE',
    description: 'Limited management with impersonation capabilities'
  },
  {
    id: 'user_sales_1',
    email: 'carol@example.com',
    name: 'Carol Sales',
    role: 'SALES_PERSON',
    description: 'Sales dashboard and customer management'
  },
  {
    id: 'user_customer_1',
    email: 'eve@example.com',
    name: 'Eve Customer',
    role: 'CUSTOMER',
    description: 'Basic customer dashboard and referrals'
  }
];

export default function DevLoginPage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDevLogin = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      // Create a dev session
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });

      if (response.ok) {
        const { teamId } = await response.json();
        router.push(`/dashboard/${teamId}`);
      } else {
        throw new Error('Failed to create dev session');
      }
    } catch (error) {
      console.error('Dev login error:', error);
      alert('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive';
      case 'ADMIN': return 'default';
      case 'EMPLOYEE': return 'secondary';
      case 'SALES_PERSON': return 'outline';
      case 'CUSTOMER': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-orange-500" />
            <CardTitle className="text-xl">Development Login</CardTitle>
          </div>
          <CardDescription>
            Quick access for testing the impersonation system
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This is a development-only feature. Do not use in production.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="user-select" className="text-sm font-medium">
              Choose Test User:
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a test user...</option>
              {DEV_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role.replace('_', ' ')}) - {user.email}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleDevLogin}
            disabled={!selectedUser || loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login as Test User'}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/signup')}
              className="text-sm"
            >
              Go to Real Signup →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
