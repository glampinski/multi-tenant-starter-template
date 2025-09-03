import { signIn, getProviders } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const email = formData.get('email') as string
            await signIn('email', { email, callbackUrl: '/dashboard/main_team' })
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Magic Link
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>You need a valid invitation to sign in.</p>
            <p>Check your email for the magic link.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
