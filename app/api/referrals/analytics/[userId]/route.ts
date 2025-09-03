import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Calculate date range
    const dateRange = getDateRange(timeframe)

    // Get comprehensive analytics
    const analytics = await getReferralAnalytics(userId, dateRange)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching referral analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

  return { start, end: now }
}

async function getReferralAnalytics(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    overallStats,
    timeSeriesData,
    conversionRates,
    topPerformers,
    rewardSummary,
    levelAnalysis
  ] = await Promise.all([
    getOverallStats(userId, dateRange),
    getTimeSeriesData(userId, dateRange),
    getConversionRates(userId, dateRange),
    getTopPerformers(userId),
    getRewardSummary(userId, dateRange),
    getLevelAnalysis(userId)
  ])

  return {
    overall: overallStats,
    timeSeries: timeSeriesData,
    conversion: conversionRates,
    topPerformers,
    rewards: rewardSummary,
    levels: levelAnalysis
  }
}

async function getOverallStats(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    totalReferrals,
    newReferrals,
    confirmedReferrals,
    totalRewards,
    newRewards
  ] = await Promise.all([
    prisma.referralRelationship.count({
      where: { referrerId: userId }
    }),
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.referralRelationship.count({
      where: { 
        referrerId: userId,
        status: 'CONFIRMED'
      }
    }),
    prisma.referralReward.aggregate({
      where: { userId },
      _sum: { amount: true }
    }),
    prisma.referralReward.aggregate({
      where: { 
        userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { amount: true }
    })
  ])

  return {
    totalReferrals,
    newReferrals,
    confirmedReferrals,
    conversionRate: totalReferrals > 0 ? (confirmedReferrals / totalReferrals) * 100 : 0,
    totalRewards: totalRewards._sum.amount || 0,
    newRewards: newRewards._sum.amount || 0
  }
}

async function getTimeSeriesData(userId: string, dateRange: { start: Date; end: Date }) {
  // Get daily referral counts
  const dailyReferrals = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed
    FROM referral_relationships
    WHERE referrer_id = ${userId}
      AND created_at >= ${dateRange.start}
      AND created_at <= ${dateRange.end}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  return dailyReferrals
}

async function getConversionRates(userId: string, dateRange: { start: Date; end: Date }) {
  const statusCounts = await prisma.referralRelationship.groupBy({
    by: ['status'],
    where: {
      referrerId: userId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  const total = statusCounts.reduce((sum: number, item: any) => sum + item._count.id, 0)
  
  return statusCounts.map((status: any) => ({
    status: status.status,
    count: status._count.id,
    percentage: total > 0 ? (status._count.id / total) * 100 : 0
  }))
}

async function getTopPerformers(userId: string) {
  return await prisma.referralRelationship.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
        }
      },
      rewards: {
        where: { userId }
      }
    },
    orderBy: {
      rewards: {
        _count: 'desc'
      }
    },
    take: 10
  })
}

async function getRewardSummary(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    totalEarned,
    pendingRewards,
    paidRewards,
    rewardsByType
  ] = await Promise.all([
    prisma.referralReward.aggregate({
      where: { userId },
      _sum: { amount: true }
    }),
    prisma.referralReward.aggregate({
      where: { 
        userId,
        isPaid: false
      },
      _sum: { amount: true }
    }),
    prisma.referralReward.aggregate({
      where: { 
        userId,
        isPaid: true
      },
      _sum: { amount: true }
    }),
    prisma.referralReward.groupBy({
      by: ['rewardType'],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true }
    })
  ])

  return {
    totalEarned: totalEarned._sum.amount || 0,
    pendingRewards: pendingRewards._sum.amount || 0,
    paidRewards: paidRewards._sum.amount || 0,
    byType: rewardsByType.map((type: any) => ({
      type: type.rewardType,
      amount: type._sum.amount || 0,
      count: type._count.id
    }))
  }
}

async function getLevelAnalysis(userId: string) {
  return await prisma.referralRelationship.groupBy({
    by: ['level'],
    where: { referrerId: userId },
    _count: { id: true },
    _avg: { level: true }
  })
}
