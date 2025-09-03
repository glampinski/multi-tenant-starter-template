import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const sendMagicLinkSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().url().optional(),
  intent: z.enum(['signin', 'signup', 'invite']).default('signin'),
  inviteToken: z.string().optional() // For invite flows
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const { email, callbackUrl, intent, inviteToken } = sendMagicLinkSchema.parse(body)
    
    // For now, just send a simple magic link email
    // TODO: Implement full SecureMagicLink integration when Prisma types are resolved
    
    // Generate a simple token for testing
    const token = Math.random().toString(36).substring(2, 15)
    
    // Construct magic link URL
    const magicLinkUrl = new URL('/api/auth/magic-link/verify', process.env.NEXTAUTH_URL!)
    magicLinkUrl.searchParams.set('token', token)
    magicLinkUrl.searchParams.set('email', email)
    
    // Send email with magic link
    await sendEmail({
      to: email,
      subject: intent === 'signup' ? 'Complete your account setup' : 
               intent === 'invite' ? 'You\'ve been invited to join' : 
               'Sign in to your account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Magic Link Authentication</h2>
          <p>Click the link below to ${intent === 'signup' ? 'complete your registration' : 'sign in'}:</p>
          <p>
            <a href="${magicLinkUrl.toString()}" 
               style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              ${intent === 'signup' ? 'Complete Registration' : 'Sign In'}
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Magic link sent successfully' 
    })
    
  } catch (error) {
    console.error('Error sending magic link:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
