'use client';

import { RoleBasedSidebar } from "@/components/role-based-sidebar";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  // Create a mock team object for compatibility
  const mockTeam = {
    id: params?.teamId || 'main_team',
    displayName: 'Main Team'
  };

  return (
    <>
      <ImpersonationBanner />
      <RoleBasedSidebar user={session.user} team={mockTeam}>
        {props.children}
      </RoleBasedSidebar>
    </>
  );
}