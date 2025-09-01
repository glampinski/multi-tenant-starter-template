'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS, getRoleDisplayName, getRoleDescription } from '@/lib/permissions';
import { useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { UserPlus, Mail, Shield, Briefcase, Users, ShoppingCart } from 'lucide-react';

export default function InvitePage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const { canInviteUsers, getInviteRoleOptions, getUserRole } = useRolePermissions();
  
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  if (!teamId || !canInviteUsers(teamId)) {
    redirect(`/dashboard/${teamId || ''}`);
  }
  
  const currentUserRole = getUserRole(teamId);
  const availableRoles = getInviteRoleOptions(teamId);
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'sales_person':
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'employee':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'customer':
        return <ShoppingCart className="h-5 w-5 text-purple-600" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedRole) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      // In production, you would call your API to send the invitation
      // with the selected role information
      console.log('Inviting user:', { email, role: selectedRole, invitedBy: user.id });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage(`Successfully sent invitation to ${email} as ${getRoleDisplayName(selectedRole as any)}`);
      setEmail('');
      setSelectedRole('');
    } catch (error) {
      setMessage('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invite Users</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Invite new users to join your team with specific roles
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send Invitation
            </CardTitle>
            <CardDescription>
              As a {getRoleDisplayName(currentUserRole!)}, you can invite the following roles:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label>Select Role</Label>
                <div className="space-y-2 mt-2">
                  {availableRoles.map((role) => (
                    <div 
                      key={role} 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedRole === role ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className="text-blue-600"
                      />
                      {getRoleIcon(role)}
                      <div>
                        <div className="font-medium">{getRoleDisplayName(role)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getRoleDescription(role)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email || !selectedRole}
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
              
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('Successfully') 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Understanding what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-300">Super Admin</div>
                  <div className="text-sm text-red-700 dark:text-red-400">
                    • View all data across the platform<br/>
                    • Manage all users and permissions<br/>
                    • Configure system settings<br/>
                    • Invite any role type
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-300">Sales Person</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    • View own customers and sales only<br/>
                    • Track personal performance metrics<br/>
                    • Invite customers to the platform<br/>
                    • Cannot see other sales people's data
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800 dark:text-green-300">Employee</div>
                  <div className="text-sm text-green-700 dark:text-green-400">
                    • View assigned tasks and projects<br/>
                    • Access data as assigned by super admin<br/>
                    • Cannot invite other users<br/>
                    • Limited administrative access
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-purple-800 dark:text-purple-300">Customer</div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">
                    • View own dashboard and account info<br/>
                    • Invite other customers only<br/>
                    • Cannot see other customers' activity<br/>
                    • Basic platform access
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
