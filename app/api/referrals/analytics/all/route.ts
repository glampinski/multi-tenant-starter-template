import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET: Fetch all referrals analytics (Super Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is super admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (userProfile?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
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
              username: true
            }
          },
          referred: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
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
      }
    })

  } catch (error) {
    console.error('Error fetching referrals analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals analytics' },
      { status: 500 }
    )
  }
}
