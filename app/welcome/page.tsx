'use client';

import React from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLES, getRoleDisplayName } from '@/lib/permissions';
import { Users, Shield, Briefcase, TrendingUp, UserCheck } from 'lucide-react';

const roleIcons = {
  [ROLES.SUPER_ADMIN]: Shield,
  [ROLES.ADMIN]: Briefcase,
  [ROLES.EMPLOYEE]: UserCheck,
  [ROLES.SALES_PERSON]: TrendingUp,
  [ROLES.CUSTOMER]: Users,
};

const roleDescriptions = {
  [ROLES.SUPER_ADMIN]: "Complete platform control, user management, and global oversight",
  [ROLES.ADMIN]: "Company-level management, team oversight, and business operations",
  [ROLES.EMPLOYEE]: "Project access, task management, and team collaboration",
  [ROLES.SALES_PERSON]: "Customer management, sales tracking, and referral networks",
  [ROLES.CUSTOMER]: "Basic platform access with referral and invitation capabilities",
};

export default function WelcomePage() {
  const user = useUser({ or: 'redirect' });
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<string>(ROLES.CUSTOMER);

  const handleContinue = () => {
    // If user already has teams, go to dashboard
    const teams = user.useTeams();
    if (teams.length > 0) {
      router.push('/dashboard');
    } else {
      // Redirect to dashboard which will show the team creation form
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Your Multi-Tenant Platform!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Hi {user.displayName || user.primaryEmail?.split('@')[0]}! 👋
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            You've successfully signed up. Let's get you set up with the perfect role for your needs.
          </p>
        </div>

        {/* Role Selection */}
        <Card className="bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Choose Your Role</CardTitle>
            <CardDescription className="text-center">
              Select the role that best describes how you'll use the platform. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(ROLES).map((role) => {
                const Icon = roleIcons[role];
                const isSelected = selectedRole === role;
                
                return (
                  <div
                    key={role}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        p-2 rounded-lg flex-shrink-0
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getRoleDisplayName(role)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {roleDescriptions[role]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">What You'll Get</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <Users className="w-8 h-8 mx-auto text-blue-500" />
                <h4 className="font-semibold">Multi-Tier Referrals</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build your network and earn from referrals
                </p>
              </div>
              <div className="space-y-2">
                <Shield className="w-8 h-8 mx-auto text-green-500" />
                <h4 className="font-semibold">Role-Based Access</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure permissions based on your role
                </p>
              </div>
              <div className="space-y-2">
                <TrendingUp className="w-8 h-8 mx-auto text-purple-500" />
                <h4 className="font-semibold">Team Management</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Collaborate with teams and organizations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Continue to Dashboard as {getRoleDisplayName(selectedRole as any)}
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You'll be able to create your first team and start collaborating
          </p>
        </div>
      </div>
    </div>
  );
}
