'use client';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PERMISSIONS, ROLES, getRoleDisplayName, getRoleDescription } from '@/lib/permissions';
import { useStackApp, useUser } from '@stackframe/stack';
import { useParams, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { UserPlus, Mail, Shield, Briefcase, Users, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

export default function InvitePage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const user = useUser({ or: 'redirect' });
  const stackApp = useStackApp();
  const { hasPermission, getUserRole } = useRolePermissions();
  
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  // Check permissions for admin email invitations
  if (!teamId || !hasPermission(teamId, PERMISSIONS.MANAGE_COMPANY_USERS)) {
    redirect(`/dashboard/${teamId || ''}`);
  }
  
  const currentUserRole = getUserRole(teamId);
  
  // Define which roles can be invited by which roles
  const getInviteableRoles = () => {
    if (hasPermission(teamId, PERMISSIONS.VIEW_ALL_DATA)) {
      // Super Admin can invite anyone except other super admins
      return [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.SALES_PERSON];
    }
    if (hasPermission(teamId, PERMISSIONS.VIEW_COMPANY_DATA)) {
      // Admin can invite employees and sales people
      return [ROLES.EMPLOYEE, ROLES.SALES_PERSON];
    }
    return []; // Others cannot send email invitations
  };

  const availableRoles = getInviteableRoles();
  
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
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    // Optional: Company domain validation for employees
    if (companyDomain && selectedRole === ROLES.EMPLOYEE) {
      const emailDomain = email.split('@')[1];
      if (emailDomain !== companyDomain) {
        return `Employee email must be from company domain: ${companyDomain}`;
      }
    }
    
    return null;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedRole) return;
    
    const emailError = validateEmail(email);
    if (emailError) {
      setMessage(emailError);
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      // Get the current team
      const team = user.useTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Send Stack Auth team invitation
      const invitation = await team.inviteUser({
        email: email,
        callbackUrl: `${window.location.origin}/handler/sign-up?team_id=${teamId}&role=${selectedRole}&type=email_invitation`,
      });

      // Store role information temporarily (in production, use proper backend)
      localStorage.setItem(`pending_invitation_${email}`, JSON.stringify({
        role: selectedRole,
        invitedBy: user.id,
        invitedAt: new Date().toISOString(),
        teamId: teamId,
        type: 'email_invitation'
      }));

      setMessage(`Invitation sent successfully to ${email} for role: ${getRoleDisplayName(selectedRole as any)}`);
      setMessageType('success');
      setEmail('');
      setSelectedRole('');
      
    } catch (error: any) {
      console.error('Invitation error:', error);
      setMessage(error.message || 'Failed to send invitation. Please try again.');
      setMessageType('error');
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
              <Mail className="h-5 w-5" />
              Email Invitation
            </CardTitle>
            <CardDescription>
              Send professional email invitations to employees and sales people.
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
                  placeholder="Enter business email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {/* Company Domain Field (for employees) */}
              {selectedRole === ROLES.EMPLOYEE && (
                <div>
                  <Label htmlFor="companyDomain">Company Domain (Optional)</Label>
                  <Input
                    id="companyDomain"
                    type="text"
                    placeholder="company.com"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If specified, employee email must be from this domain
                  </p>
                </div>
              )}
              
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
                <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
                  {messageType === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
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
