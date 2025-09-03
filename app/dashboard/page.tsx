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

    // Redirect to the main team dashboard
    router.push('/dashboard/main_team');
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
