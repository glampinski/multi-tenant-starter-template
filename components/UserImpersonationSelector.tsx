'use client';

import { useState, useEffect } from 'react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@prisma/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserImpersonationSelectorProps {
  teamId: string;
}

export function UserImpersonationSelector({ teamId }: UserImpersonationSelectorProps) {
  const { canImpersonate, currentUser } = useEnhancedPermissions();
  const { startImpersonation, isImpersonating } = useImpersonation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Check if current user can impersonate
  const hasImpersonationPermission = canImpersonate(teamId);

  // Fetch available users for impersonation
  const fetchUsers = async () => {
    if (!hasImpersonationPermission) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/users?canImpersonate=true`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [teamId, hasImpersonationPermission]);

  const handleImpersonate = () => {
    const selectedUser = users.find(u => u.stackUserId === selectedUserId);
    if (selectedUser) {
      startImpersonation(selectedUser);
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive';
      case 'ADMIN': return 'default';
      case 'EMPLOYEE': return 'secondary';
      case 'SALES_PERSON': return 'outline';
      case 'CUSTOMER': return 'secondary';
      default: return 'outline';
    }
  };

  // Don't show if user doesn't have permission or is already impersonating
  if (!hasImpersonationPermission || isImpersonating) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Impersonation Controls
        </CardTitle>
        <CardDescription className="text-xs">
          View the system as another user while retaining your admin privileges
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="user-select" className="text-xs font-medium">
            Select User to Impersonate:
          </label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select">
              <SelectValue placeholder={loading ? "Loading users..." : "Choose a user..."} />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.stackUserId} value={user.stackUserId}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span className="text-sm">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email
                        }
                      </span>
                    </div>
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)} 
                      className="text-xs ml-2"
                    >
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleImpersonate}
          disabled={!selectedUserId || loading}
          className="w-full"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Start Impersonation
        </Button>
        
        {users.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center">
            No users available for impersonation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
