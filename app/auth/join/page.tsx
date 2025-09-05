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
  
  const tokenId = searchParams.get('id'); // Use 'id' instead of full token
  const email = searchParams.get('email');

  useEffect(() => {
    if (!tokenId) {
      setError('Invalid invitation link - missing token ID');
      return;
    }

    // Validate token ID securely without exposing the full token
    const validateInvitation = async () => {
      try {
        const response = await fetch('/api/auth/validate-invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token: tokenId, // The API expects 'token' but we're sending the safe ID
          }),
        });

        const result = await response.json();
        
        if (result.isValid && result.invite) {
          setInviteData({
            tokenId,
            email: result.invite.email || email || '',
            role: result.invite.role,
            teamName: result.invite.tenant?.name || 'Main Team',
            inviterName: `${result.invite.inviter?.firstName || ''} ${result.invite.inviter?.lastName || ''}`.trim(),
            expiresAt: result.invite.expiresAt
          });
        } else {
          setError(result.message || 'Invalid or expired invitation');
        }
      } catch (error) {
        console.error('Failed to validate invitation:', error);
        setError('Failed to validate invitation. Please try again.');
      }
    };

    validateInvitation();
  }, [tokenId, email]);

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const userEmail = formData.get('email') as string;

    try {
      // For this invitation system, we'll redirect to the signin page
      // with the email pre-filled and a callback URL that includes the invitation token ID
      const callbackUrl = `/welcome?tokenId=${tokenId}&invited=true`;
      
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

  if (!tokenId || error) {
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
