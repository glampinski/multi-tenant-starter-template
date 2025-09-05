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
import { Building2, Loader2, Mail } from "lucide-react";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  primaryColor?: string;
  logoUrl?: string;
}

export default function TenantAwareSignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState("");
  const [tenantContext, setTenantContext] = useState<TenantInfo | null>(null);
  const [showTenantSelection, setShowTenantSelection] = useState(false);

  // Check for tenant context from URL parameters
  const tenantSlug = searchParams.get("tenant");
  const tenantDomain = searchParams.get("domain");
  const inviteToken = searchParams.get("token");

  const fetchTenantContext = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tenantSlug) params.set("slug", tenantSlug);
      if (tenantDomain) params.set("domain", tenantDomain);

      const response = await fetch(`/api/auth/tenant-context?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTenantContext(data.tenant);
      }
    } catch (error) {
      console.error("Failed to fetch tenant context:", error);
    }
  }, [tenantSlug, tenantDomain]);

  useEffect(() => {
    setIsMounted(true);
    
    // If we have tenant context from URL, fetch tenant information
    if (tenantSlug || tenantDomain) {
      fetchTenantContext();
    }
  }, [tenantSlug, tenantDomain, fetchTenantContext]);

  const handleEmailCheck = async (email: string) => {
    try {
      const response = await fetch("/api/auth/check-tenant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenantId: tenantContext?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Email check failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      // Check if user has access to this tenant (if tenant context exists)
      if (tenantContext) {
        const accessCheck = await handleEmailCheck(email);
        if (!accessCheck?.hasAccess) {
          setError(
            `This email is not associated with ${tenantContext.name}. Please contact your administrator for access.`
          );
          setIsLoading(false);
          return;
        }
      }

      // Build callback URL with tenant context
      const params = new URLSearchParams();
      if (tenantContext) {
        params.set("tenantId", tenantContext.id);
        params.set("tenantSlug", tenantContext.slug);
      }
      if (inviteToken) params.set("token", inviteToken);

      let callbackUrl = "/dashboard";
      if (params.toString()) {
        callbackUrl += `?${params.toString()}`;
      }

      // Check user role for redirect
      try {
        const roleCheckResponse = await fetch("/api/auth/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tenantId: tenantContext?.id }),
        });

        if (roleCheckResponse.ok) {
          const { role, teamId } = await roleCheckResponse.json();

          if (!role) {
            callbackUrl = "/auth/access-denied";
          } else {
            // Role-based dashboard routing with tenant context
            switch (role) {
              case "SUPER_ADMIN":
                callbackUrl = "/admin-panel";
                break;
              case "ADMIN":
                callbackUrl = tenantContext 
                  ? `/dashboard/${teamId || "admin_team"}?tenant=${tenantContext.slug}`
                  : `/dashboard/${teamId || "admin_team"}`;
                break;
              case "EMPLOYEE":
                callbackUrl = tenantContext
                  ? `/dashboard/${teamId || "employee_team"}?tenant=${tenantContext.slug}`
                  : `/dashboard/${teamId || "employee_team"}`;
                break;
              case "SALES_PERSON":
                callbackUrl = tenantContext
                  ? `/dashboard/${teamId || "sales_team"}?tenant=${tenantContext.slug}`
                  : `/dashboard/${teamId || "sales_team"}`;
                break;
              case "CUSTOMER":
                callbackUrl = tenantContext
                  ? `/dashboard/${teamId || "customer_team"}?tenant=${tenantContext.slug}`
                  : `/dashboard/${teamId || "customer_team"}`;
                break;
              default:
                callbackUrl = "/auth/access-denied";
            }
          }
        }
      } catch (error) {
        console.log("Could not check role, using default redirect");
      }

      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      // Show success message
      setSentEmail(email);
      setEmailSent(true);
      setIsLoading(false);

      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = "/auth/verify-request";
      }, 2000);
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An error occurred during sign in. Please try again.");
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

  if (emailSent) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We sent a magic link to <strong>{sentEmail}</strong>
              {tenantContext && (
                <span className="block mt-2 text-sm">
                  for access to <strong>{tenantContext.name}</strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              Click the link in the email to sign in. You can close this window.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">
              {tenantContext ? `Sign in to ${tenantContext.name}` : "Sign in"}
            </CardTitle>
          </div>
          <CardDescription>
            {tenantContext ? (
              <div className="space-y-2">
                <span>Enter your email to access your account</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(tenantContext.status)}`}>
                    {tenantContext.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tenantContext.plan} Plan
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {tenantContext.slug}.yourapp.com
                </div>
              </div>
            ) : (
              "Enter your email to receive a magic link"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                "Send magic link"
              )}
            </Button>

            {!tenantContext && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowTenantSelection(!showTenantSelection)}
                >
                  Need to access a specific organization?
                </Button>
              </div>
            )}

            {showTenantSelection && (
              <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="tenant-input" className="text-sm">
                  Organization domain or slug
                </Label>
                <Input
                  id="tenant-input"
                  placeholder="company-name or company.yourapp.com"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" className="w-full">
                  Access organization
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
