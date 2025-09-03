'use client';

import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ImpersonationBanner() {
  const { impersonatedUser, isImpersonating, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between border-b shadow-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <div className="flex items-center gap-2">
          <span className="font-medium">You are impersonating:</span>
          <Badge variant="secondary" className="bg-red-500 text-white border-red-400">
            {impersonatedUser.firstName && impersonatedUser.lastName 
              ? `${impersonatedUser.firstName} ${impersonatedUser.lastName}`
              : impersonatedUser.email
            }
          </Badge>
          <span className="text-red-200 text-sm">
            ({impersonatedUser.role.replace('_', ' ').toLowerCase()})
          </span>
        </div>
      </div>
      
      <Button
        onClick={stopImpersonation}
        variant="outline"
        size="sm"
        className="bg-transparent border-red-300 text-white hover:bg-red-700 hover:border-red-200"
      >
        <X className="h-4 w-4 mr-1" />
        Exit Impersonation
      </Button>
    </div>
  );
}
