import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTeamContext, TeamContextRequest } from '@/lib/teamContext'

// GET: Fetch all referrals analytics with team isolation
async function getAllReferralsAnalyticsHandler(req: TeamContextRequest) {
  try {
    const { userProfile, teamId } = req
    
    if (!userProfile || !teamId) {
      return NextResponse.json({ error: 'Team context required' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build team-scoped where clause
    const where: any = {
      AND: [
        // Ensure both referrer and referred are in the same team
        {
          referrer: { teamId: teamId },
          referred: { teamId: teamId }
        }
      ]
    }
    
    if (status) {
      where.AND.push({ status: status })
    }

    // For non-super-admin roles, further restrict access
    if (userProfile.role !== 'SUPER_ADMIN') {
      // Team admins can see all team referrals
      // Sales people can only see their own referrals
      if (userProfile.role === 'SALES_PERSON') {
        where.AND.push({
          OR: [
            { referrerId: userProfile.id },
            { referredId: userProfile.id }
          ]
        })
      }
    }

    // Fetch referral relationships with user details
    const [referrals, totalCount] = await Promise.all([
      prisma.referralRelationship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              teamId: true
            }
          },
          referred: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              teamId: true
            }
          },
          rewards: {
            select: {
              id: true,
              amount: true,
              currency: true,
              rewardType: true,
              isPaid: true,
              createdAt: true,
              paidAt: true
            }
          }
        }
      }),
      prisma.referralRelationship.count({ where })
    ])

    // Transform data for the frontend
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      referrerName: `${referral.referrer.firstName || ''} ${referral.referrer.lastName || ''}`.trim() || referral.referrer.username,
      referrerEmail: referral.referrer.email,
      referredName: `${referral.referred.firstName || ''} ${referral.referred.lastName || ''}`.trim() || referral.referred.username,
      referredEmail: referral.referred.email,
      level: referral.level,
      status: referral.status,
      commission: referral.rewards.reduce((sum, reward) => sum + Number(reward.amount), 0),
      isPaid: referral.rewards.every(reward => reward.isPaid),
      createdAt: referral.createdAt,
      confirmedAt: referral.confirmedAt,
      rewardedAt: referral.rewardedAt,
      totalRewards: referral.rewards.length,
      rewards: referral.rewards
    }))

    const totalPages = Math.ceil(totalCount / limit)

    // Calculate summary statistics
    const totalCommissions = formattedReferrals.reduce((sum, ref) => sum + ref.commission, 0)
    const paidCommissions = formattedReferrals
      .filter(ref => ref.isPaid)
      .reduce((sum, ref) => sum + ref.commission, 0)
    const pendingCommissions = totalCommissions - paidCommissions

    return NextResponse.json({
      referrals: formattedReferrals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: {
        totalReferrals: totalCount,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        averageCommission: totalCount > 0 ? totalCommissions / totalCount : 0
      },
      teamId // Include team context for frontend
    })

  } catch (error) {
    console.error('Error fetching referrals analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals analytics' },
      { status: 500 }
    )
  }
}

export const GET = withTeamContext(getAllReferralsAnalyticsHandler)
