"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Calendar, Copy, Check } from "lucide-react";
import { UserRole } from "@prisma/client";

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  used: boolean;
  expiresAt: Date;
  inviterName: string;
  createdAt: Date;
}

interface TenantInvitationManagerProps {
  tenantId: string;
  tenantName: string;
  onInvitationSent?: (invitation: Invitation) => void;
}

export default function TenantInvitationManager({ 
  tenantId, 
  tenantName, 
  onInvitationSent 
}: TenantInvitationManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSendInvitation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const role = formData.get("role") as UserRole;

    try {
      const response = await fetch("/api/tenant/send-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          tenantId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Invitation sent to ${email}`);
        
        // Add to local state
        const newInvitation: Invitation = {
          id: data.invitation.id,
          email: data.invitation.email,
          role: data.invitation.role,
          token: data.invitation.token,
          used: false,
          expiresAt: new Date(data.invitation.expiresAt),
          inviterName: data.invitation.inviterName,
          createdAt: new Date(data.invitation.createdAt),
        };
        
        setInvitations(prev => [newInvitation, ...prev]);
        onInvitationSent?.(newInvitation);
        
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Invitation error:", error);
      setError("An error occurred while sending the invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/signup?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case UserRole.EMPLOYEE:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case UserRole.SALES_PERSON:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case UserRole.CUSTOMER:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isExpired = (date: Date) => new Date() > date;

  return (
    <div className="space-y-6">
      {/* Send Invitation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle>Invite Users to {tenantName}</CardTitle>
          </div>
          <CardDescription>
            Send invitations to new users to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                    <SelectItem value={UserRole.SALES_PERSON}>Sales Person</SelectItem>
                    <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Recent Invitations</span>
            </CardTitle>
            <CardDescription>
              Manage and track your recent invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge className={`text-xs ${getRoleColor(invitation.role)}`}>
                        {invitation.role.replace("_", " ")}
                      </Badge>
                      {invitation.used && (
                        <Badge variant="outline" className="text-xs">
                          Accepted
                        </Badge>
                      )}
                      {isExpired(invitation.expiresAt) && !invitation.used && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span>Sent {formatDate(invitation.createdAt)}</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires {formatDate(invitation.expiresAt)}
                      </span>
                    </div>
                  </div>
                  
                  {!invitation.used && !isExpired(invitation.expiresAt) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invitation.token)}
                      className="ml-2"
                    >
                      {copiedToken === invitation.token ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
