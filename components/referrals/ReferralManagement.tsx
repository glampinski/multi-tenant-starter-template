'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralManagementProps {
  teamId: string;
}

export function ReferralManagement({ teamId }: ReferralManagementProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referral Management</CardTitle>
          <CardDescription>
            Manage your referral program and track performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Referral management functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}