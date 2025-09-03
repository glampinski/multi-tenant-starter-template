'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');
  const ref = searchParams.get('ref');
  const type = searchParams.get('type');
  const targetRole = searchParams.get('target_role');

  useEffect(() => {
    // If no referral or invitation context, redirect to home
    if (!token && !ref) {
      router.push('/?error=signup-requires-invitation');
    }
  }, [token, ref, router]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      // Build callback URL with invitation/referral context
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (ref) params.set('ref', ref);
      if (type) params.set('type', type);
      if (targetRole) params.set('target_role', targetRole);
      
      const callbackUrl = `/welcome?${params.toString()}`;
      
      // Use the new secure magic link API
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          intent: token ? 'invite' : 'signup',
          callbackUrl,
          inviteToken: token || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      // Show success message
      setError(''); // Clear any previous errors
      // Redirect to a success page or show success message
      router.push(`/auth/verify-request?email=${encodeURIComponent(email)}&type=${token ? 'invite' : 'signup'}`);
      
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (token) return 'Complete Your Invitation';
    if (ref && type === 'referral') return `Join via ${ref}'s referral`;
    return 'Sign Up';
  };

  const getDescription = () => {
    if (token) return 'You\'ve been invited to join our platform. Enter your email to get started.';
    if (ref && type === 'referral') return `${ref} has referred you to join our platform. Sign up to get started!`;
    return 'Create your account to get started.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </Button>

            <div className="text-sm text-center text-gray-600">
              <p>We'll send you a secure link to complete your registration.</p>
              {ref && type === 'referral' && (
                <p className="mt-2 font-medium">Referred by: <span className="text-blue-600">{ref}</span></p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
