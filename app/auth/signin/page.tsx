'use client'

import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    
    try {
      // Check user role to determine the correct redirect URL
      let callbackUrl = '/dashboard/main_team'; // default for regular users
      
      try {
        const roleCheckResponse = await fetch('/api/auth/check-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (roleCheckResponse.ok) {
          const { role } = await roleCheckResponse.json();
          if (role === 'SUPER_ADMIN') {
            callbackUrl = '/admin-panel';
          }
        }
      } catch (error) {
        console.log('Could not check role, using default redirect');
      }
      
      const result = await signIn('email', { 
        email, 
        callbackUrl,
        redirect: false // Handle redirect manually for better UX
      })
      
      console.log('Sign in result:', result)
      
      // Show success message
      setSentEmail(email)
      setEmailSent(true)
      setIsLoading(false)
      
      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = '/auth/verify-request'
      }, 2000)
      
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  // Show loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
      <Card className="w-full max-w-md" suppressHydrationWarning>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {emailSent ? 'Check your email' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {emailSent 
              ? 'A sign in link has been sent to your email address.'
              : 'Enter your email to receive a magic link'
            }
          </CardDescription>
        </CardHeader>
        <CardContent suppressHydrationWarning>
          {emailSent ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="text-6xl">📧</div>
              <p className="text-gray-600">
                Magic link sent to:
              </p>
              <p className="font-semibold text-blue-600">
                {sentEmail}
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in. The link will expire in 24 hours.
              </p>
              <p className="text-xs text-gray-400">
                Redirecting to verification page...
              </p>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} suppressHydrationWarning>
              <div className="space-y-4" suppressHydrationWarning>
                <div suppressHydrationWarning>
                  <Label htmlFor="email">Email</Label>
                  <div suppressHydrationWarning>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="glampinski@gmail.com"
                      required
                      disabled={isLoading}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning>
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </div>
            </form>
          )}
          
          {!emailSent && (
            <div className="mt-6 text-center text-sm text-gray-600" suppressHydrationWarning>
              <p>You need a valid invitation to sign in.</p>
              <p>Use: <strong>glampinski@gmail.com</strong> for testing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
