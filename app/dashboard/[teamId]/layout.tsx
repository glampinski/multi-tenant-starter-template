'use client';

import { RoleBasedSidebar } from "@/components/role-based-sidebar";
import { useUser } from "@stackframe/stack";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(params.teamId);
  const router = useRouter();

  useEffect(() => {
    if (!team) {
      router.push('/dashboard');
    }
  }, [team, router]);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleBasedSidebar>
      {props.children}
    </RoleBasedSidebar>
  );
}