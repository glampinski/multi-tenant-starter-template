import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stackServerApp } from '@/stack'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Get all referrals made by this user (their downline)
    const referralTree = await prisma.referralRelationship.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            stackUserId: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
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

    // Get referral statistics
    const stats = await getReferralStats(userId)

    // Build hierarchical tree structure
    const treeStructure = await buildReferralTree(userId)

    return NextResponse.json({
      referrals: referralTree,
      stats,
      tree: treeStructure
    })
  } catch (error) {
    console.error('Error fetching referral tree:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getReferralStats(userId: string) {
  const [
    totalReferrals,
    confirmedReferrals,
    pendingReferrals,
    totalEarnings,
    levelBreakdown
  ] = await Promise.all([
    // Total referrals made
    prisma.referralRelationship.count({
      where: { referrerId: userId }
    }),
    
    // Confirmed referrals
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        status: 'CONFIRMED'
      }
    }),
    
    // Pending referrals
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        status: 'PENDING'
      }
    }),
    
    // Total earnings from referrals
    prisma.referralReward.aggregate({
      where: { userId: userId },
      _sum: { amount: true }
    }),
    
    // Breakdown by level
    prisma.referralRelationship.groupBy({
      by: ['level'],
      where: { referrerId: userId },
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

async function buildReferralTree(userId: string, level: number = 1): Promise<any[]> {
  if (level > 5) return [] // Max 5 levels

  const directReferrals = await prisma.referralRelationship.findMany({
    where: { 
      referrerId: userId,
      level: 1 // Only direct referrals for tree building
    },
    include: {
      referred: {
        select: {
          id: true,
          stackUserId: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
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
      children: await buildReferralTree(referral.referredId, level + 1)
    }))
  )

  return tree
}
