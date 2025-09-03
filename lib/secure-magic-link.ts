import * as crypto from 'crypto'
import { prisma } from './prisma'

interface MagicLinkOptions {
  email: string
  intent: 'signin' | 'invite' | 'password-reset' | 'signup'
  userAgent?: string
  ipAddress?: string
  inviteTokenId?: string
  callbackUrl?: string
  inviteToken?: string
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

export class SecureMagicLink {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TTL_MINUTES = 5
  private static readonly MAX_TOKENS_PER_EMAIL = 3
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 15
  private static readonly MAX_REQUESTS_PER_WINDOW = 5

  /**
   * Generate a secure magic link token
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

    // Check active token count using new tracking method
    await this.enforceTokenLimit(email)

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    // Store hashed token in database
    const tokenRecord = await prisma.magicLinkToken.create({
      data: {
        hashedToken,
        email: email.toLowerCase(),
        intent,
        userAgent,
        ipAddress,
        inviteTokenId,
        expiresAt: new Date(Date.now() + this.TTL_MINUTES * 60 * 1000),
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
   * Verify and consume a magic link token
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
        // Return same response whether token exists or not (enumeration safe)
        return { success: false, error: 'Invalid or expired verification link' }
      }

      // Optional: Verify UA binding (can be disabled for better UX)
      if (tokenRecord.userAgent && tokenRecord.userAgent !== userAgent) {
        console.warn('[SECURITY] User agent mismatch for magic link token', {
          tokenId: tokenRecord.id,
          expected: tokenRecord.userAgent,
          actual: userAgent
        })
        // Note: Not failing on UA mismatch to allow cross-device usage
      }

      // Mark token as used (one-time use)
      await prisma.magicLinkToken.update({
        where: { id: tokenRecord.id },
        data: { 
          used: true
          // Note: sessionId and usedAt fields will be added in future schema updates
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
   * Check rate limits for magic link requests
   */
  static async checkRateLimit(email: string, ipAddress?: string): Promise<RateLimitResult> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

    // Check email rate limit - using findFirst for now
    const emailLimit = await prisma.magicLinkRateLimit.findFirst({
      where: {
        identifier: email.toLowerCase(),
        type: 'email'
      }
    })

    if (emailLimit) {
      if (emailLimit.windowStart > windowStart) {
        if (emailLimit.requestCount >= this.MAX_REQUESTS_PER_WINDOW) {
          const retryAfter = Math.ceil((emailLimit.windowStart.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000)
          return { allowed: false, retryAfter }
        }
      }
    }

    // Check IP rate limit if available
    if (ipAddress) {
      const ipLimit = await prisma.magicLinkRateLimit.findFirst({
        where: {
          identifier: ipAddress,
          type: 'ip'
        }
      })

      if (ipLimit) {
        if (ipLimit.windowStart > windowStart) {
          if (ipLimit.requestCount >= this.MAX_REQUESTS_PER_WINDOW * 2) { // Higher limit for IP
            const retryAfter = Math.ceil((ipLimit.windowStart.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000)
            return { allowed: false, retryAfter }
          }
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Update rate limiting counters
   */
  private static async updateRateLimit(email: string, ipAddress?: string): Promise<void> {
    const now = new Date()

    // For now, use findFirst and create new records if needed
    // This is a simplified version until the unique constraints are properly working
    try {
      // Try to update email rate limit
      const existingEmailLimit = await prisma.magicLinkRateLimit.findFirst({
        where: {
          identifier: email.toLowerCase(),
          type: 'email'
        }
      })

      if (existingEmailLimit) {
        await prisma.magicLinkRateLimit.update({
          where: { id: existingEmailLimit.id },
          data: {
            requestCount: { increment: 1 },
            lastRequest: now
          }
        })
      } else {
        await prisma.magicLinkRateLimit.create({
          data: {
            identifier: email.toLowerCase(),
            type: 'email',
            action: 'request',
            requestCount: 1,
            windowStart: now,
            lastRequest: now
          } as any // Temporary type assertion until Prisma client is properly updated
        })
      }

      // Handle IP rate limit if provided
      if (ipAddress) {
        const existingIpLimit = await prisma.magicLinkRateLimit.findFirst({
          where: {
            identifier: ipAddress,
            type: 'ip'
          }
        })

        if (existingIpLimit) {
          await prisma.magicLinkRateLimit.update({
            where: { id: existingIpLimit.id },
            data: {
              requestCount: { increment: 1 },
              lastRequest: now
            }
          })
        } else {
          await prisma.magicLinkRateLimit.create({
            data: {
              identifier: ipAddress,
              type: 'ip',
              action: 'request',
              requestCount: 1,
              windowStart: now,
              lastRequest: now
            } as any // Temporary type assertion until Prisma client is properly updated
          })
        }
      }
    } catch (error) {
      console.error('[RATE_LIMIT_UPDATE_ERROR]', error)
      // Continue execution even if rate limit update fails
    }
  }

  /**
   * Enforce token count limits using direct count
   */
  private static async enforceTokenLimit(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase()
    
    // Get current active token count directly
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
   * Clean up expired tokens and reset rate limits
   */
  private static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()
    const cleanupWindowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)

    await Promise.all([
      // Delete expired magic link tokens
      prisma.magicLinkToken.deleteMany({
        where: {
          expiresAt: { lt: now }
        }
      }),
      
      // Reset expired rate limits
      prisma.magicLinkRateLimit.deleteMany({
        where: {
          windowStart: { lt: cleanupWindowStart }
        }
      }),

      // Clean up expired invite tokens
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
}
