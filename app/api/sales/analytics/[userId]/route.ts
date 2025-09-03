import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Check permissions
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id }
    })

    if (userProfile?.role === 'SALES_PERSON' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const dateRange = getDateRange(timeframe)
    const analytics = await getSalesAnalytics(userId, dateRange)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching sales analytics:', error)
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

async function getSalesAnalytics(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    performanceMetrics,
    pipelineAnalysis,
    activityBreakdown,
    conversionRates,
    revenueAnalysis,
    goalProgress,
    timeSeriesData
  ] = await Promise.all([
    getPerformanceMetrics(userId, dateRange),
    getPipelineAnalysis(userId),
    getActivityBreakdown(userId, dateRange),
    getConversionRates(userId, dateRange),
    getRevenueAnalysis(userId, dateRange),
    getGoalProgress(userId, dateRange),
    getTimeSeriesData(userId, dateRange)
  ])

  return {
    performance: performanceMetrics,
    pipeline: pipelineAnalysis,
    activities: activityBreakdown,
    conversion: conversionRates,
    revenue: revenueAnalysis,
    goals: goalProgress,
    timeSeries: timeSeriesData
  }
}

async function getPerformanceMetrics(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    totalCustomers,
    newLeads,
    conversions,
    avgDealSize,
    totalRevenue,
    activities
  ] = await Promise.all([
    prisma.customer.count({
      where: { salesPersonId: userId }
    }),
    prisma.customer.count({
      where: { 
        salesPersonId: userId,
        status: 'LEAD',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.customer.count({
      where: { 
        salesPersonId: userId,
        status: 'ACTIVE',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.customer.aggregate({
      where: { 
        salesPersonId: userId,
        status: 'ACTIVE'
      },
      _avg: { actualValue: true }
    }),
    prisma.customer.aggregate({
      where: { 
        salesPersonId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { actualValue: true }
    }),
    prisma.salesActivity.count({
      where: { 
        salesPersonId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    })
  ])

  return {
    totalCustomers,
    newLeads,
    conversions,
    conversionRate: newLeads > 0 ? (conversions / newLeads) * 100 : 0,
    avgDealSize: avgDealSize._avg.actualValue || 0,
    totalRevenue: totalRevenue._sum.actualValue || 0,
    activities
  }
}

async function getPipelineAnalysis(userId: string) {
  const pipeline = await prisma.customer.groupBy({
    by: ['status'],
    where: { salesPersonId: userId },
    _count: { id: true },
    _sum: { estimatedValue: true }
  })

  return pipeline.map((stage: any) => ({
    stage: stage.status,
    count: stage._count.id,
    value: stage._sum.estimatedValue || 0
  }))
}

async function getActivityBreakdown(userId: string, dateRange: { start: Date; end: Date }) {
  const activities = await prisma.salesActivity.groupBy({
    by: ['type'],
    where: { 
      salesPersonId: userId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  const outcomeAnalysis = await prisma.salesActivity.groupBy({
    by: ['outcome'],
    where: { 
      salesPersonId: userId,
      outcome: { not: null },
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  return {
    byType: activities.map((activity: any) => ({
      type: activity.type,
      count: activity._count.id
    })),
    byOutcome: outcomeAnalysis.map((outcome: any) => ({
      outcome: outcome.outcome,
      count: outcome._count.id
    }))
  }
}

async function getConversionRates(userId: string, dateRange: { start: Date; end: Date }) {
  // Calculate conversion rates through the funnel
  const funnelData = await prisma.customer.groupBy({
    by: ['status'],
    where: { 
      salesPersonId: userId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  const statusMap = funnelData.reduce((acc: any, item: any) => {
    acc[item.status] = item._count.id
    return acc
  }, {})

  const leads = statusMap.LEAD || 0
  const prospects = statusMap.PROSPECT || 0
  const active = statusMap.ACTIVE || 0

  return {
    leadToProspect: leads > 0 ? (prospects / leads) * 100 : 0,
    prospectToActive: prospects > 0 ? (active / prospects) * 100 : 0,
    leadToActive: leads > 0 ? (active / leads) * 100 : 0,
    overall: leads > 0 ? ((prospects + active) / leads) * 100 : 0
  }
}

async function getRevenueAnalysis(userId: string, dateRange: { start: Date; end: Date }) {
  const [
    currentPeriod,
    previousPeriod,
    monthlyRevenue
  ] = await Promise.all([
    prisma.customer.aggregate({
      where: { 
        salesPersonId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { actualValue: true },
      _count: { id: true }
    }),
    prisma.customer.aggregate({
      where: { 
        salesPersonId: userId,
        createdAt: {
          gte: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
          lte: dateRange.start
        }
      },
      _sum: { actualValue: true }
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(actual_value) as revenue,
        COUNT(*) as deals
      FROM customers
      WHERE sales_person_id = ${userId}
        AND actual_value IS NOT NULL
        AND created_at >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)} -- Last year
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `
  ])

  // Calculate growth percentage
  const currentRevenue = currentPeriod._sum.actualValue || 0
  const previousRevenue = previousPeriod._sum.actualValue || 0
  const growth = Number(previousRevenue) > 0 ? ((Number(currentRevenue) - Number(previousRevenue)) / Number(previousRevenue)) * 100 : 0

  return {
    currentRevenue,
    previousRevenue,
    growth,
    dealCount: currentPeriod._count.id,
    monthlyTrend: monthlyRevenue
  }
}

async function getGoalProgress(userId: string, dateRange: { start: Date; end: Date }) {
  // This would typically come from a goals/targets table
  // For now, we'll calculate based on performance
  const revenue = await prisma.customer.aggregate({
    where: { 
      salesPersonId: userId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _sum: { actualValue: true }
  })

  // Mock goals - in a real app, these would come from a goals table
  const monthlyRevenueGoal = 50000 // $50k monthly goal
  const monthlyLeadsGoal = 20 // 20 leads per month
  const conversionRateGoal = 15 // 15% conversion rate

  const leadsThisPeriod = await prisma.customer.count({
    where: { 
      salesPersonId: userId,
      status: 'LEAD',
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }
  })

  const conversionsThisPeriod = await prisma.customer.count({
    where: { 
      salesPersonId: userId,
      status: 'ACTIVE',
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }
  })

  const actualConversionRate = leadsThisPeriod > 0 ? (conversionsThisPeriod / leadsThisPeriod) * 100 : 0

  return {
    revenue: {
      goal: monthlyRevenueGoal,
      actual: revenue._sum.actualValue || 0,
      progress: revenue._sum.actualValue ? (Number(revenue._sum.actualValue) / monthlyRevenueGoal) * 100 : 0
    },
    leads: {
      goal: monthlyLeadsGoal,
      actual: leadsThisPeriod,
      progress: (leadsThisPeriod / monthlyLeadsGoal) * 100
    },
    conversion: {
      goal: conversionRateGoal,
      actual: actualConversionRate,
      progress: (actualConversionRate / conversionRateGoal) * 100
    }
  }
}

async function getTimeSeriesData(userId: string, dateRange: { start: Date; end: Date }) {
  const dailyMetrics = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_customers,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as conversions,
      SUM(actual_value) as revenue
    FROM customers
    WHERE sales_person_id = ${userId}
      AND created_at >= ${dateRange.start}
      AND created_at <= ${dateRange.end}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  return dailyMetrics
}
