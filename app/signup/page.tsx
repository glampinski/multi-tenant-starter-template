'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStackApp } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserCheck, AlertCircle, Check } from 'lucide-react';
import { ROLES, getRoleDisplayName } from '@/lib/permissions';

interface ReferrerInfo {
  username: string;
  displayName?: string;
  role?: string;
  isValid: boolean;
}

export default function CustomSignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stackApp = useStackApp();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: searchParams.get('email') || '', // Pre-fill from invitation
    password: '',
    confirmPassword: ''
  });
  
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'verification'>('form');

  // Get referral information from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    const type = searchParams.get('type');
    const referrerRole = searchParams.get('referrer_role');
    const targetRole = searchParams.get('target_role');
    
    if (!ref || type !== 'referral') {
      // No referral code or wrong type - redirect to home with error
      router.push('/?error=invitation-required');
      return;
    }

    // Validate this is a customer/sales referral
    const validReferralRoles = [ROLES.CUSTOMER, ROLES.SALES_PERSON];
    if (!referrerRole || !validReferralRoles.includes(referrerRole as any)) {
      router.push('/?error=invalid-referral-type');
      return;
    }

    // In a real app, you'd fetch this from your API
    // For demo, we'll simulate the referrer lookup
    const mockReferrerInfo: ReferrerInfo = {
      username: ref,
      displayName: `${ref.charAt(0).toUpperCase()}${ref.slice(1)} User`,
      role: referrerRole || ROLES.CUSTOMER,
      isValid: true
    };

    setReferrerInfo(mockReferrerInfo);
  }, [searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create account using Stack Auth
      const result = await stackApp.signUpWithCredential({
        email: formData.email,
        password: formData.password,
        noRedirect: true
      });

      if (result.status === 'ok') {
        // Store referral info in localStorage temporarily
        // In production, you'd send this to your API
        localStorage.setItem('signupReferralInfo', JSON.stringify({
          referredBy: referrerInfo?.username,
          referrerRole: referrerInfo?.role,
          firstName: formData.firstName,
          lastName: formData.lastName
        }));
        
        // Move to verification step
        setStep('verification');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no referrer info
  if (!referrerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!referrerInfo.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <CardTitle className="text-red-700">Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid or has expired. Please contact the person who invited you for a new link.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Check className="w-6 h-6 text-green-500" />
              <CardTitle className="text-green-700">Check Your Email</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We've sent a verification email to <strong>{formData.email}</strong>. 
              Please check your inbox and click the verification link to complete your signup.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Check your spam folder if you don't see the email</p>
              <p>• The link will expire in 24 hours</p>
              <p>• You'll be automatically signed in after verification</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Referrer Info */}
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-800 dark:text-green-300">
                You're Invited!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-700 dark:text-green-300">
                <strong>{referrerInfo.displayName}</strong> (@{referrerInfo.username}) has invited you to join our platform
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                  {getRoleDisplayName((referrerInfo.role || ROLES.CUSTOMER) as any)}
                </span>
                <span className="text-green-600 dark:text-green-400">Referrer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Complete the form below to join the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Repeat your password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
              <p className="mt-2">
                <Users className="w-4 h-4 inline mr-1" />
                Invitation-only platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
