import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            A sign in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="text-6xl">📧</div>
            <p className="text-gray-600">
              Click the link in the email to sign in.
            </p>
            <p className="text-sm text-gray-500">
              The link will expire in 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
