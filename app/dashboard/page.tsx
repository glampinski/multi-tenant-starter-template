'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Role-based dashboard redirection
    const redirectToDashboard = async () => {
      try {
        // Get user role from session or check via API
        let userRole = session.user?.role;
        
        if (!userRole && session.user?.email) {
          // Fallback: check role via API if not in session
          const roleResponse = await fetch('/api/auth/check-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          });
          
          if (roleResponse.ok) {
            const { role } = await roleResponse.json();
            userRole = role;
          }
        }
        
        // Redirect based on role
        switch (userRole) {
          case 'SUPER_ADMIN':
            router.push('/admin-panel');
            break;
          case 'ADMIN':
            router.push('/dashboard/admin_team');
            break;
          case 'EMPLOYEE':
            router.push('/dashboard/employee_team');
            break;
          case 'SALES_PERSON':
            router.push('/dashboard/sales_team');
            break;
          case 'CUSTOMER':
            router.push('/dashboard/customer_team');
            break;
          default:
            // If no role found, user is not authorized
            router.push('/auth/access-denied');
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        // Send to access denied page on error
        router.push('/auth/access-denied');
      }
    };

    redirectToDashboard();
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p>Redirecting to sign in...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-8 text-center">
        <p>Redirecting to dashboard...</p>
      </Card>
    </div>
  );
}
