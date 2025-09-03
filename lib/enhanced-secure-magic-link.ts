import * as crypto from 'crypto'
import { prisma } from './prisma'

interface MagicLinkOptions {
  email: string
  intent: 'signin' | 'invite' | 'password-reset' | 'signup'
  userAgent?: string
  ipAddress?: string
  inviteTokenId?: string
  callbackUrl?: string
}

interface TokenValidation {
  success: boolean
  email?: string
  intent?: string
  isInvite?: boolean
  error?: string
}

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
}

export class EnhancedSecureMagicLink {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TTL_MINUTES = 5 // Short TTL as per security audit
  private static readonly MAX_TOKENS_PER_EMAIL = 3
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 15
  private static readonly MAX_REQUESTS_PER_WINDOW = 5

  /**
   * Generate a secure magic link token with enhanced security
   */
  static async generateToken(options: MagicLinkOptions): Promise<{ token: string; tokenId: string }> {
    const { email, intent, userAgent, ipAddress, inviteTokenId } = options
    
    // For invite-only: validate invite token first
    if (intent === 'invite' && !inviteTokenId) {
      throw new Error('Invite token required for signup')
    }

    if (inviteTokenId) {
      const inviteToken = await prisma.inviteToken.findUnique({
        where: { id: inviteTokenId, used: false }
      })
      
      if (!inviteToken || inviteToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired invite token')
      }

      // Check if invite has remaining uses
      if (inviteToken.currentUses >= inviteToken.maxUses) {
        throw new Error('Invite token has been fully used')
      }
    }

    // Rate limiting check
    const rateLimitResult = await this.checkRateLimit(email, ipAddress)
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`)
    }

    // Clean up expired tokens
    await this.cleanupExpiredTokens()

    // Enforce token count limits
    await this.enforceTokenLimit(email)

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    // Calculate exact expiration time (5-10 minutes)
    const expirationMinutes = this.TTL_MINUTES + Math.floor(Math.random() * 5) // 5-10 minutes
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

    // Store hashed token in database with all available security fields
    const tokenRecord = await prisma.magicLinkToken.create({
      data: {
        hashedToken,
        email: email.toLowerCase(),
        intent,
        userAgent,
        ipAddress,
        inviteTokenId,
        expiresAt,
        used: false
      }
    })

    // Update rate limiting
    await this.updateRateLimit(email, ipAddress)

    return {
      token: rawToken,
      tokenId: tokenRecord.id
    }
  }

  /**
   * Verify and consume a magic link token with enhanced security
   */
  static async verifyToken(
    rawToken: string,
    email: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenValidation> {
    try {
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

      const tokenRecord = await prisma.magicLinkToken.findFirst({
        where: {
          hashedToken,
          email: email.toLowerCase(),
          expiresAt: { gt: new Date() },
          used: false
        },
        include: {
          inviteToken: true
        }
      })

      if (!tokenRecord) {
        // Enumeration-safe response - same response whether token exists or not
        return { success: false, error: 'Invalid or expired verification link' }
      }

      // Enhanced security: Check user agent binding (optional, for cross-device support)
      if (tokenRecord.userAgent && tokenRecord.userAgent !== userAgent) {
        console.warn('[SECURITY] User agent mismatch for magic link token', {
          tokenId: tokenRecord.id,
          expected: tokenRecord.userAgent,
          actual: userAgent,
          email: email.toLowerCase()
        })
        // Note: Not failing on UA mismatch to allow cross-device usage
        // But we log it for security monitoring
      }

      // Enhanced security: Check IP binding (optional, for mobility support)
      if (tokenRecord.ipAddress && tokenRecord.ipAddress !== ipAddress) {
        console.warn('[SECURITY] IP address mismatch for magic link token', {
          tokenId: tokenRecord.id,
          expected: tokenRecord.ipAddress,
          actual: ipAddress,
          email: email.toLowerCase()
        })
        // Note: Not failing on IP mismatch to allow mobility
        // But we log it for security monitoring
      }

      // Mark token as used (one-time use)
      await prisma.magicLinkToken.update({
        where: { id: tokenRecord.id },
        data: { 
          used: true
          // Note: usedAt and sessionId fields will be added when schema is fully updated
        }
      })

      // If this was an invite, increment usage counter
      if (tokenRecord.inviteTokenId && tokenRecord.inviteToken) {
        await prisma.inviteToken.update({
          where: { id: tokenRecord.inviteTokenId },
          data: { 
            currentUses: { increment: 1 },
            used: tokenRecord.inviteToken.currentUses + 1 >= tokenRecord.inviteToken.maxUses
          }
        })
      }

      return {
        success: true,
        email: tokenRecord.email,
        intent: tokenRecord.intent,
        isInvite: !!tokenRecord.inviteTokenId
      }

    } catch (error) {
      console.error('[MAGIC_LINK_VERIFY_ERROR]', error)
      return { success: false, error: 'Verification failed' }
    }
  }

  /**
   * Enhanced rate limiting with separate request/resend tracking
   */
  static async checkRateLimit(email: string, ipAddress?: string): Promise<RateLimitResult> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

    // Check email rate limit
    const emailLimits = await prisma.magicLinkRateLimit.findMany({
      where: {
        identifier: email.toLowerCase(),
        type: 'email',
        windowStart: { gt: windowStart }
      }
    })

    const totalEmailRequests = emailLimits.reduce((sum, limit) => sum + limit.requestCount, 0)
    if (totalEmailRequests >= this.MAX_REQUESTS_PER_WINDOW) {
      const oldestWindow = emailLimits.reduce((oldest, limit) => 
        limit.windowStart < oldest ? limit.windowStart : oldest, now)
      const retryAfter = Math.ceil((oldestWindow.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000)
      return { allowed: false, retryAfter }
    }

    // Check IP rate limit if available (higher threshold)
    if (ipAddress) {
      const ipLimits = await prisma.magicLinkRateLimit.findMany({
        where: {
          identifier: ipAddress,
          type: 'ip',
          windowStart: { gt: windowStart }
        }
      })

      const totalIpRequests = ipLimits.reduce((sum, limit) => sum + limit.requestCount, 0)
      if (totalIpRequests >= this.MAX_REQUESTS_PER_WINDOW * 3) { // Higher limit for IP
        const oldestWindow = ipLimits.reduce((oldest, limit) => 
          limit.windowStart < oldest ? limit.windowStart : oldest, now)
        const retryAfter = Math.ceil((oldestWindow.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000)
        return { allowed: false, retryAfter }
      }
    }

    return { allowed: true }
  }

  /**
   * Update rate limiting counters
   */
  private static async updateRateLimit(email: string, ipAddress?: string): Promise<void> {
    const now = new Date()

    try {
      // Create email rate limit record
      await prisma.magicLinkRateLimit.create({
        data: {
          identifier: email.toLowerCase(),
          type: 'email',
          action: 'request',
          requestCount: 1,
          windowStart: now,
          lastRequest: now
        } as any // Temporary type assertion
      })

      // Create IP rate limit record if available
      if (ipAddress) {
        await prisma.magicLinkRateLimit.create({
          data: {
            identifier: ipAddress,
            type: 'ip',
            action: 'request', 
            requestCount: 1,
            windowStart: now,
            lastRequest: now
          } as any // Temporary type assertion
        })
      }
    } catch (error) {
      console.error('[RATE_LIMIT_UPDATE_ERROR]', error)
      // Continue execution even if rate limit update fails
    }
  }

  /**
   * Enforce token count limits per email
   */
  private static async enforceTokenLimit(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase()
    
    // Get current active token count
    const activeCount = await prisma.magicLinkToken.count({
      where: {
        email: normalizedEmail,
        expiresAt: { gt: new Date() },
        used: false
      }
    })

    // Check if limit is exceeded
    if (activeCount >= this.MAX_TOKENS_PER_EMAIL) {
      throw new Error('Too many active tokens. Please wait before requesting another.')
    }
  }

  /**
   * Clean up expired tokens and old rate limits
   */
  private static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()
    const cleanupWindowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

    try {
      await Promise.all([
        // Delete expired magic link tokens
        prisma.magicLinkToken.deleteMany({
          where: {
            expiresAt: { lt: now }
          }
        }),
        
        // Delete old rate limit records
        prisma.magicLinkRateLimit.deleteMany({
          where: {
            windowStart: { lt: cleanupWindowStart }
          }
        }),

        // Mark expired invite tokens as used
        prisma.inviteToken.updateMany({
          where: {
            expiresAt: { lt: now },
            used: false
          },
          data: {
            used: true
          }
        })
      ])
    } catch (error) {
      console.error('[CLEANUP_ERROR]', error)
      // Don't throw - cleanup failures shouldn't break main functionality
    }
  }

  /**
   * Revoke all active tokens for an email (security measure)
   */
  static async revokeAllTokens(email: string): Promise<void> {
    await prisma.magicLinkToken.updateMany({
      where: {
        email: email.toLowerCase(),
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: {
        used: true
      }
    })
  }

  /**
   * Get security statistics for monitoring
   */
  static async getSecurityStats(email?: string) {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const stats = {
      activeTokens: await prisma.magicLinkToken.count({
        where: {
          ...(email && { email: email.toLowerCase() }),
          expiresAt: { gt: now },
          used: false
        }
      }),
      tokensLast24h: await prisma.magicLinkToken.count({
        where: {
          ...(email && { email: email.toLowerCase() }),
          createdAt: { gt: last24Hours }
        }
      }),
      rateLimitViolations: await prisma.magicLinkRateLimit.count({
        where: {
          ...(email && { identifier: email.toLowerCase() }),
          requestCount: { gte: this.MAX_REQUESTS_PER_WINDOW },
          lastRequest: { gt: last24Hours }
        }
      })
    }

    return stats
  }
}
