"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { ROLES, getRoleDisplayName } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PageClient() {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const teams = user.useTeams();
  const [teamDisplayName, setTeamDisplayName] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<string>(ROLES.CUSTOMER);

  React.useEffect(() => {
    if (teams.length > 0 && !user.selectedTeam) {
      user.setSelectedTeam(teams[0]);
    }
  }, [teams, user]);

  // Handle navigation after team selection
  React.useEffect(() => {
    if (user.selectedTeam) {
      router.push(`/dashboard/${user.selectedTeam.id}`);
    }
  }, [user.selectedTeam, router]);

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">Welcome!</CardTitle>
            <CardDescription className="text-center">
              Create your first team to get started with our role-based platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Include role information in team name for demo purposes
                // In production, you'd store this in team metadata
                const rolePrefix = selectedRole === ROLES.SUPER_ADMIN ? "SuperAdmin" : 
                                 selectedRole === ROLES.ADMIN ? "Admin" :
                                 selectedRole === ROLES.EMPLOYEE ? "Employee" :
                                 selectedRole === ROLES.SALES_PERSON ? "Sales" : "Customer";
                user.createTeam({ displayName: `${rolePrefix}-${teamDisplayName}` });
              }}
              className="space-y-4"
            >
              <div>
                <Label className="text-sm font-medium">Team Name</Label>
                <Input
                  placeholder="Enter team name"
                  value={teamDisplayName}
                  onChange={(e) => setTeamDisplayName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Your Role</Label>
                <div className="space-y-2 mt-2">
                  {Object.values(ROLES).map((role) => (
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
                      <div>
                        <div className="font-medium">{getRoleDisplayName(role)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {role === ROLES.SUPER_ADMIN && "Full platform access and user management"}
                          {role === ROLES.ADMIN && "Company-level management and user oversight"}
                          {role === ROLES.EMPLOYEE && "Access assigned tasks and projects"}
                          {role === ROLES.SALES_PERSON && "Manage your customers and track sales"}
                          {role === ROLES.CUSTOMER && "Basic access with invitation capabilities"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={!teamDisplayName}>
                Create Team as {getRoleDisplayName(selectedRole as any)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while redirecting to team dashboard
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
