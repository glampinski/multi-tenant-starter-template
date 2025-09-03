'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from 'next-auth/react';

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - missing token');
      return;
    }

    // In a real implementation, you would validate the token here
    // For now, we'll just set some mock data
    setInviteData({
      token,
      email: email || '',
      role: 'SALES_REP',
      teamName: 'Main Team'
    });
  }, [token, email]);

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const userEmail = formData.get('email') as string;

    try {
      // For this invitation system, we'll redirect to the signin page
      // with the email pre-filled and a callback URL that includes the invitation token
      const callbackUrl = `/welcome?token=${token}&invited=true`;
      
      // Trigger magic link authentication
      const result = await signIn('email', {
        email: userEmail,
        callbackUrl,
        redirect: false
      });

      if (result?.error) {
        setError('Failed to send invitation email. Please try again.');
      } else {
        // Redirect to email verification page
        router.push(`/auth/verify-request?email=${encodeURIComponent(userEmail)}&invited=true`);
      }
    } catch (error) {
      console.error('Join error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              {error || 'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Our Team</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join {inviteData?.teamName || 'our team'} as a {inviteData?.role || 'team member'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
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
                defaultValue={inviteData?.email || ''}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Join Team'}
            </Button>

            <div className="text-sm text-center text-gray-600">
              <p>We&apos;ll send you a magic link to complete your registration.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
