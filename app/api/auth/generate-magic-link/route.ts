import { NextRequest, NextResponse } from 'next/server'
import { EnhancedSecureMagicLink } from '../../../../lib/enhanced-secure-magic-link'

// Security headers
const SECURITY_HEADERS = {
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, intent = 'signin', inviteTokenId, callbackUrl } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Validate intent
    const validIntents = ['signin', 'invite', 'password-reset', 'signup']
    if (!validIntents.includes(intent)) {
      return NextResponse.json(
        { error: 'Invalid intent' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // For invite intent, require invite token
    if (intent === 'invite' && !inviteTokenId) {
      return NextResponse.json(
        { error: 'Invite token required for signup' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Get client info for security
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      request.headers.get('cf-connecting-ip') ||
      undefined

    // Generate secure magic link token
    const result = await EnhancedSecureMagicLink.generateToken({
      email,
      intent,
      userAgent,
      ipAddress,
      inviteTokenId,
      callbackUrl
    })

    // Log security event
    console.log('[SECURITY_AUDIT]', {
      action: 'magic_link_generate',
      resource: email,
      success: true,
      ipAddress,
      userAgent,
      details: {
        intent,
        hasInvite: !!inviteTokenId,
        tokenId: result.tokenId
      },
      riskLevel: 'low',
      timestamp: new Date().toISOString()
    })

    // In a real app, you would send the email here
    // For security, we don't return the actual token in the response
    return NextResponse.json(
      {
        success: true,
        message: 'Magic link sent to your email',
        tokenId: result.tokenId // For testing/debugging only
      },
      { headers: SECURITY_HEADERS }
    )

  } catch (error) {
    console.error('[MAGIC_LINK_GENERATE_ERROR]', error)

    // Log security event
    console.log('[SECURITY_AUDIT]', {
      action: 'magic_link_generate',
      success: false,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      riskLevel: 'medium',
      timestamp: new Date().toISOString()
    })

    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: SECURITY_HEADERS }
      )
    }

    // Check if it's a token limit error
    if (error instanceof Error && error.message.includes('Too many active tokens')) {
      return NextResponse.json(
        { error: 'Too many pending requests. Please wait before requesting another magic link.' },
        { status: 429, headers: SECURITY_HEADERS }
      )
    }

    // Enumeration-safe error response
    return NextResponse.json(
      { error: 'Failed to send magic link. Please try again.' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { 
      status: 405, 
      headers: {
        ...SECURITY_HEADERS,
        'Allow': 'POST'
      }
    }
  )
}
