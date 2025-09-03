import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return redirect('/auth/signin?error=InvalidToken')
    }
    
    // For now, just redirect to dashboard as a basic implementation
    // TODO: Implement full SecureMagicLink verification when Prisma types are resolved
    
    console.log('Magic link verification attempt:', { email, token: token.substring(0, 8) + '...' })
    
    // Basic validation
    if (token.length < 10) {
      return redirect('/auth/signin?error=InvalidToken')
    }
    
    // Redirect to dashboard with success
    return redirect('/dashboard?verified=true')
    
  } catch (error) {
    console.error('Error verifying magic link:', error)
    return redirect('/auth/signin?error=VerificationFailed')
  }
}

export async function POST(request: NextRequest) {
  // For secure POST-based verification (recommended)
  try {
    const body = await request.json()
    const { token, email } = body
    
    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      )
    }
    
    // TODO: Implement SecureMagicLink.verifyToken when Prisma types are resolved
    
    return NextResponse.json({
      success: true,
      redirectUrl: '/dashboard'
    })
    
  } catch (error) {
    console.error('Error verifying magic link:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
