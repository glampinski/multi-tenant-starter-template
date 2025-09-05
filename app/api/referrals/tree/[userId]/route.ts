import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTeamContext, TeamContextRequest } from '@/lib/teamContext'

async function getReferralTreeHandler(
  req: TeamContextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userProfile, teamId } = req
    const { userId } = await params
    
    if (!userProfile || !teamId) {
      return NextResponse.json({ error: 'Team context required' }, { status: 400 })
    }

    // Validate that the target user is in the same team
    const targetUser = await prisma.userProfile.findFirst({
      where: {
        id: userId,
        teamId: teamId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in this team' }, { status: 404 })
    }

    // Permission check: users can only view their own tree unless they're admin/super-admin
    if (userProfile.role === 'CUSTOMER' || userProfile.role === 'SALES_PERSON') {
      if (userProfile.id !== userId) {
        return NextResponse.json({ error: 'Forbidden - Can only view own referral tree' }, { status: 403 })
      }
    }

    // Get all referrals made by this user (their downline) within the team
    const referralTree = await prisma.referralRelationship.findMany({
      where: { 
        referrerId: userId,
        // Ensure both referrer and referred are in the same team
        referrer: { teamId: teamId },
        referred: { teamId: teamId }
      },
      include: {
        referred: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            teamId: true
          }
        },
        rewards: {
          where: { userId: userId }
        }
      },
      orderBy: [
        { level: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get referral statistics within team
    const stats = await getReferralStats(userId, teamId)

    // Build hierarchical tree structure within team
    const treeStructure = await buildReferralTree(userId, teamId)

    return NextResponse.json({
      referrals: referralTree,
      stats,
      tree: treeStructure,
      teamId
    })
  } catch (error) {
    console.error('Error fetching referral tree:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getReferralStats(userId: string, teamId: string) {
  const [
    totalReferrals,
    confirmedReferrals,
    pendingReferrals,
    totalEarnings,
    levelBreakdown
  ] = await Promise.all([
    // Total referrals made within team
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        referrer: { teamId: teamId },
        referred: { teamId: teamId }
      }
    }),
    
    // Confirmed referrals within team
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        status: 'CONFIRMED',
        referrer: { teamId: teamId },
        referred: { teamId: teamId }
      }
    }),
    
    // Pending referrals within team
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        status: 'PENDING',
        referrer: { teamId: teamId },
        referred: { teamId: teamId }
      }
    }),
    
    // Total earnings from referrals
    prisma.referralReward.aggregate({
      where: { userId: userId },
      _sum: { amount: true }
    }),
    
    // Breakdown by level within team
    prisma.referralRelationship.groupBy({
      by: ['level'],
      where: { 
        referrerId: userId,
        referrer: { teamId: teamId },
        referred: { teamId: teamId }
      },
      _count: { id: true }
    })
  ])

  return {
    totalReferrals,
    confirmedReferrals,
    pendingReferrals,
    totalEarnings: totalEarnings._sum.amount || 0,
    levelBreakdown: levelBreakdown.map((level: any) => ({
      level: level.level,
      count: level._count.id
    }))
  }
}

async function buildReferralTree(userId: string, teamId: string, level: number = 1): Promise<any[]> {
  if (level > 5) return [] // Max 5 levels

  const directReferrals = await prisma.referralRelationship.findMany({
    where: { 
      referrerId: userId,
      level: 1, // Only direct referrals for tree building
      // Ensure both users are in the same team
      referrer: { teamId: teamId },
      referred: { teamId: teamId }
    },
    include: {
      referred: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          teamId: true
        }
      },
      rewards: {
        where: { userId: userId }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Recursively build tree for each direct referral
  const tree = await Promise.all(
    directReferrals.map(async (referral: any) => ({
      ...referral,
      children: await buildReferralTree(referral.referredId, teamId, level + 1)
    }))
  )

  return tree
}

export const GET = withTeamContext(getReferralTreeHandler)
