"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Mail, UserPlus, CheckCircle } from "lucide-react";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  primaryColor?: string;
  logoUrl?: string;
}

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  invitedBy: string;
  tenant: TenantInfo;
  isValid: boolean;
  isExpired: boolean;
}

export default function TenantAwareSignUp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check for invitation token from URL parameters
  const inviteToken = searchParams.get("token");
  const email = searchParams.get("email");

  const validateInviteToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteInfo(data);
        
        if (!data.isValid) {
          setError("This invitation link is invalid or has expired.");
        }
      } else {
        setError("Invalid invitation link.");
      }
    } catch (error) {
      console.error("Failed to validate invite token:", error);
      setError("Failed to validate invitation. Please try again.");
    }
  }, [inviteToken]);

  useEffect(() => {
    setIsMounted(true);
    
    // If we have an invite token, validate it and get tenant information
    if (inviteToken) {
      validateInviteToken();
    }
  }, [inviteToken, validateInviteToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    try {
      // Validate email matches invite if token provided
      if (inviteInfo && formEmail.toLowerCase() !== inviteInfo.email.toLowerCase()) {
        setError("Email must match the invitation email address.");
        setIsLoading(false);
        return;
      }

      // Check if user already exists
      const userCheckResponse = await fetch("/api/auth/check-user-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail }),
      });

      if (userCheckResponse.ok) {
        const { exists } = await userCheckResponse.json();
        if (exists) {
          setError("An account with this email already exists. Please sign in instead.");
          setIsLoading(false);
          return;
        }
      }

      // Create user profile or accept invitation
      const createUserResponse = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          firstName,
          lastName,
          inviteToken: inviteToken,
          tenantId: inviteInfo?.tenant?.id,
        }),
      });

      if (createUserResponse.ok) {
        const userData = await createUserResponse.json();
        
        // Build callback URL with tenant context
        const params = new URLSearchParams();
        if (inviteInfo?.tenant) {
          params.set("tenantId", inviteInfo.tenant.id);
          params.set("tenantSlug", inviteInfo.tenant.slug);
        }
        if (inviteToken) params.set("token", inviteToken);

        let callbackUrl = "/welcome";
        if (params.toString()) {
          callbackUrl += `?${params.toString()}`;
        }

        // Send magic link for account activation
        const result = await signIn("email", {
          email: formEmail,
          callbackUrl,
          redirect: false,
        });

        setSuccess(`Account created successfully! Check your email for the verification link.`);
        setAccountCreated(true);
        setIsLoading(false);

        // Redirect after showing success message
        setTimeout(() => {
          window.location.href = "/auth/verify-request";
        }, 3000);
      } else {
        const errorData = await createUserResponse.json();
        setError(errorData.error || "Failed to create account. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setError("An error occurred during sign up. Please try again.");
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "trial":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  if (accountCreated) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Account Created!</CardTitle>
            <CardDescription>
              <div className="space-y-2">
                <span>Check your email to verify your account</span>
                {inviteInfo?.tenant && (
                  <div className="mt-2">
                    <span className="text-sm">
                      You&apos;re joining <strong>{inviteInfo.tenant.name}</strong>
                    </span>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(inviteInfo.tenant.status)}`}>
                        {inviteInfo.tenant.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {inviteInfo.tenant.plan} Plan
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              Click the link in the email to activate your account. You can close this window.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            {inviteInfo?.tenant ? (
              <Building2 className="h-6 w-6 text-primary" />
            ) : (
              <UserPlus className="h-6 w-6 text-primary" />
            )}
            <CardTitle className="text-xl">
              {inviteInfo?.tenant ? `Join ${inviteInfo.tenant.name}` : "Create Account"}
            </CardTitle>
          </div>
          <CardDescription>
            {inviteInfo ? (
              <div className="space-y-2">
                <span>
                          <span>
          You&apos;ve been invited to join as a <strong>{inviteInfo.role.toLowerCase()}</strong>
        </span>
                </span>
                {inviteInfo.tenant && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(inviteInfo.tenant.status)}`}>
                      {inviteInfo.tenant.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {inviteInfo.tenant.plan} Plan
                    </Badge>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {inviteInfo.tenant?.slug}.yourapp.com
                </div>
              </div>
            ) : (
              "Enter your details to create a new account"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  defaultValue={inviteInfo?.firstName || ""}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  defaultValue={inviteInfo?.lastName || ""}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={inviteInfo?.email || email || ""}
                required
                disabled={isLoading || !!inviteInfo?.email}
              />
              {inviteInfo?.email && (
                <p className="text-xs text-muted-foreground">
                  Email pre-filled from invitation
                </p>
              )}
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

            <Button type="submit" className="w-full" disabled={isLoading || (inviteInfo ? !inviteInfo.isValid : false)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : inviteInfo ? (
                "Accept Invitation"
              ) : (
                "Create Account"
              )}
            </Button>

            {!inviteToken && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => router.push("/auth/signin")}
                >
                  Already have an account? Sign in
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
