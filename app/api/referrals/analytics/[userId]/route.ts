import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantContext, getTenantId } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { getSessionWithTenant } from '@/lib/session-utils'
import { MODULES, ACTIONS } from '@/types/permissions'

// GET: Fetch referral analytics with tenant isolation
async function getReferralAnalytics(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const tenant = getTenantContext(enhancedReq)
      const tenantId = getTenantId(enhancedReq)
      const { userId } = await params
      
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get session with tenant context and validate permissions
      const session = await getSessionWithTenant()
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Verify session tenant matches request tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Tenant access denied' }, { status: 403 })
      }

      // Check permissions for viewing referral analytics
      const canViewReferrals = await hasPermission(
        session.user.id, 
        session.user.tenantId,
        session.user.teamId || '', 
        MODULES.REFERRALS, 
        ACTIONS.VIEW
      )

      if (!canViewReferrals) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      // Validate that the target user is in the same tenant
      const targetUser = await prisma.userProfile.findFirst({
        where: {
          id: userId,
          tenantId: tenantId
        } as any
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found in this tenant' }, { status: 404 })
      }

      // Additional authorization: users can only view their own analytics unless they're admin/super_admin
      if (userId !== session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Can only view your own referral analytics' }, { status: 403 })
      }

      const { searchParams } = new URL(enhancedReq.url)
      const timeframe = searchParams.get('timeframe') || '30d'

      // Calculate date range
      const dateRange = getDateRange(timeframe)

      // Get referral analytics for this user within the tenant
      const [referralsGiven, referralsReceived, rewards] = await Promise.all([
        // Referrals given by this user
        prisma.referralRelationship.findMany({
          where: {
            referrerId: userId,
            tenantId: tenantId,
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          } as any,
          include: {
            referred: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        
        // Referrals received by this user
        prisma.referralRelationship.findMany({
          where: {
            referredId: userId,
            tenantId: tenantId,
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          } as any,
          include: {
            referrer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        
        // Reward summary
        prisma.referralReward.findMany({
          where: {
            userId: userId,
            tenantId: tenantId,
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          } as any
        })
      ])

      // Calculate analytics
      const totalReferralsGiven = referralsGiven.length
      const totalReferralsReceived = referralsReceived.length
      const totalRewards = rewards.reduce((sum, reward) => sum + Number(reward.amount), 0)

      // Get referral tree (simplified version)
      const referralTree = await buildReferralTree(userId, tenantId)

      return NextResponse.json({
        success: true,
        analytics: {
          user: {
            id: targetUser.id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            email: targetUser.email
          },
          timeframe,
          dateRange,
          stats: {
            totalReferralsGiven,
            totalReferralsReceived,
            totalRewards: totalRewards.toFixed(2),
            referralTree
          },
          referralsGiven,
          referralsReceived,
          rewards
        },
        tenant: {
          id: tenant?.id,
          name: tenant?.name
        }
      })
    } catch (error) {
      console.error('Error fetching referral analytics:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

// Helper function to build referral tree with tenant isolation
async function buildReferralTree(userId: string, tenantId: string) {
  const directReferrals = await prisma.referralRelationship.findMany({
    where: {
      referrerId: userId,
      tenantId: tenantId,
      level: 1
    } as any,
    include: {
      referred: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return {
    userId,
    directReferrals: directReferrals.length,
    children: directReferrals.map(ref => ({
      id: ref.referred.id,
      name: `${ref.referred.firstName} ${ref.referred.lastName}`,
      email: ref.referred.email,
      level: ref.level,
      status: ref.status,
      createdAt: ref.createdAt
    }))
  }
}

// Helper function to calculate date ranges
function getDateRange(timeframe: string) {
  const now = new Date()
  const start = new Date()

  switch (timeframe) {
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setDate(now.getDate() - 30)
  }

  return {
    start,
    end: now
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return getReferralAnalytics(request, { params })
}
