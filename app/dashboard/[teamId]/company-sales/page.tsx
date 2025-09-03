'use client'

import { useParams } from 'next/navigation'

export default function CompanySalesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Company Sales Dashboard</h1>
      <p>Sales analytics for team: {teamId}</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-gray-600">
          Sales dashboard functionality is temporarily under maintenance. 
          Please check back later.
        </p>
      </div>
    </div>
  );
}