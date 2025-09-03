import { NextRequest, NextResponse } from 'next/server'
import { EnhancedSecureMagicLink } from '../../../../lib/enhanced-secure-magic-link'
import { prisma } from '../../../../lib/prisma'

// Security headers for magic link verification
const SECURITY_HEADERS = {
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email } = body

    // Validate required fields
    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Get client info for security logging
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      request.headers.get('cf-connecting-ip') ||
      undefined

    // Verify the magic link token
    const verification = await EnhancedSecureMagicLink.verifyToken(
      token,
      email,
      userAgent,
      ipAddress
    )

    // Log security event
    await logSecurityEvent({
      action: 'magic_link_verify',
      email,
      success: verification.success,
      ipAddress,
      userAgent,
      details: {
        intent: verification.intent,
        isInvite: verification.isInvite
      }
    })

    if (!verification.success) {
      // Enumeration-safe response - same response for all failures
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        email: verification.email,
        intent: verification.intent,
        isInvite: verification.isInvite
      },
      { headers: SECURITY_HEADERS }
    )

  } catch (error) {
    console.error('[MAGIC_LINK_VERIFY_ERROR]', error)
    
    // Log security event for error
    await logSecurityEvent({
      action: 'magic_link_verify',
      success: false,
      details: { error: 'verification_failed' }
    })

    // Enumeration-safe error response
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

// Security audit logging helper
async function logSecurityEvent({
  userId = null,
  action,
  email = null,
  success = true,
  ipAddress = null,
  userAgent = null,
  details = {}
}: {
  userId?: string | null
  action: string
  email?: string | null
  success?: boolean
  ipAddress?: string | null
  userAgent?: string | null
  details?: any
}) {
  try {
    // For now, just log to console until the SecurityAuditLog table is properly available
    console.log('[SECURITY_AUDIT]', {
      userId,
      action,
      resource: email,
      success,
      ipAddress,
      userAgent,
      details,
      riskLevel: success ? 'low' : 'medium',
      timestamp: new Date().toISOString()
    })
    
    // TODO: Implement database logging when SecurityAuditLog model is available
    // await prisma.securityAuditLog.create({...})
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error)
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Prevent GET requests (security requirement)
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
