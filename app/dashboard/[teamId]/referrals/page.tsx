'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ReferralManagement } from '@/components/referrals/ReferralManagement';

export default function ReferralsPage() {
  const params = useParams<{ teamId: string }>();
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referral Network</h1>
        <p className="text-gray-600 mt-2">
          Manage your referral network and track your multi-tier earnings
        </p>
      </div>
      
      <ReferralManagement teamId={params.teamId} />
    </div>
  );
}
