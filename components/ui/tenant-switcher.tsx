"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Building2, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  primaryColor?: string;
  logoUrl?: string;
}

interface TenantSwitcherProps {
  className?: string;
  showBadge?: boolean;
}

export function TenantSwitcher({ className, showBadge = true }: TenantSwitcherProps) {
  const { data: session } = useSession();
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [accessibleTenants, setAccessibleTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  // Fetch current tenant information
  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch user's tenant information
        const response = await fetch('/api/auth/tenant-info');
        if (response.ok) {
          const data = await response.json();
          if (data.tenant) {
            setCurrentTenant(data.tenant);
            // For now, user has access to only their primary tenant
            // In the future, this could be extended for multi-tenant access
            setAccessibleTenants([data.tenant]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tenant information:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantInfo();
  }, [session?.user?.id]);

  // Handle tenant switching (for future multi-tenant user support)
  const handleTenantSwitch = async (tenantId: string) => {
    if (!currentTenant || tenantId === currentTenant.id) return;

    try {
      setIsSwitching(true);
      
      // API call to switch tenant context
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        // Refresh the page to update the tenant context
        window.location.reload();
      } else {
        console.error('Failed to switch tenant');
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Get tenant status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'trial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Get plan color
  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'professional':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'basic':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading tenant...</span>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No tenant</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 h-auto p-2 ${className}`}
          style={{ 
            borderColor: currentTenant.primaryColor 
              ? `${currentTenant.primaryColor}40` 
              : undefined 
          }}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentTenant.logoUrl} alt={currentTenant.name} />
            <AvatarFallback className="text-xs">
              {currentTenant.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate max-w-32">
              {currentTenant.name}
            </span>
            {showBadge && (
              <div className="flex space-x-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1 py-0 ${getStatusColor(currentTenant.status)}`}
                >
                  {currentTenant.status}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1 py-0 ${getPlanColor(currentTenant.plan)}`}
                >
                  {currentTenant.plan}
                </Badge>
              </div>
            )}
          </div>
          
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">Current Tenant</p>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentTenant.logoUrl} alt={currentTenant.name} />
                <AvatarFallback>
                  {currentTenant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-xs font-medium">{currentTenant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentTenant.slug}.yourapp.com
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(currentTenant.status)}`}
              >
                {currentTenant.status}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPlanColor(currentTenant.plan)}`}
              >
                {currentTenant.plan} Plan
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Accessible Tenants
        </DropdownMenuLabel>
        
        {accessibleTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleTenantSwitch(tenant.id)}
            disabled={isSwitching}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={tenant.logoUrl} alt={tenant.name} />
              <AvatarFallback className="text-xs">
                {tenant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{tenant.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {tenant.slug}.yourapp.com
              </span>
            </div>
            
            {tenant.id === currentTenant.id && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            
            {isSwitching && tenant.id !== currentTenant.id && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
          Future: Multi-tenant access support
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
