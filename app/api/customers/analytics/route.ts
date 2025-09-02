import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stackServerApp } from '@/stack'

export async function GET(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const salesPersonId = searchParams.get('salesPersonId') || user.id
    const timeframe = searchParams.get('timeframe') || '30d'

    // Calculate date range
    const dateRange = getDateRange(timeframe)

    // Check permissions - sales people can only see their own analytics
    const userProfile = await prisma.userProfile.findUnique({
      where: { stackUserId: user.id }
    })

    if (userProfile?.role === 'SALES_PERSON' && salesPersonId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const analytics = await getCustomerAnalytics(salesPersonId, dateRange)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching customer analytics:', error)
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

async function getCustomerAnalytics(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const [
    overallStats,
    statusBreakdown,
    sourceAnalysis,
    revenueMetrics,
    activitySummary,
    conversionFunnel,
    timeSeriesData
  ] = await Promise.all([
    getOverallCustomerStats(salesPersonId, dateRange),
    getStatusBreakdown(salesPersonId),
    getSourceAnalysis(salesPersonId, dateRange),
    getRevenueMetrics(salesPersonId, dateRange),
    getActivitySummary(salesPersonId, dateRange),
    getConversionFunnel(salesPersonId, dateRange),
    getTimeSeriesData(salesPersonId, dateRange)
  ])

  return {
    overall: overallStats,
    status: statusBreakdown,
    sources: sourceAnalysis,
    revenue: revenueMetrics,
    activities: activitySummary,
    funnel: conversionFunnel,
    timeSeries: timeSeriesData
  }
}

async function getOverallCustomerStats(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const [
    totalCustomers,
    newCustomers,
    activeCustomers,
    averageValue,
    totalValue
  ] = await Promise.all([
    prisma.customer.count({
      where: { salesPersonId }
    }),
    prisma.customer.count({
      where: { 
        salesPersonId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.customer.count({
      where: { 
        salesPersonId,
        status: 'ACTIVE'
      }
    }),
    prisma.customer.aggregate({
      where: { salesPersonId },
      _avg: { actualValue: true }
    }),
    prisma.customer.aggregate({
      where: { salesPersonId },
      _sum: { actualValue: true }
    })
  ])

  return {
    totalCustomers,
    newCustomers,
    activeCustomers,
    conversionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
    averageValue: averageValue._avg.actualValue || 0,
    totalValue: totalValue._sum.actualValue || 0
  }
}

async function getStatusBreakdown(salesPersonId: string) {
  const statusCounts = await prisma.customer.groupBy({
    by: ['status'],
    where: { salesPersonId },
    _count: { id: true }
  })

  const total = statusCounts.reduce((sum: number, item: any) => sum + item._count.id, 0)

  return statusCounts.map((status: any) => ({
    status: status.status,
    count: status._count.id,
    percentage: total > 0 ? (status._count.id / total) * 100 : 0
  }))
}

async function getSourceAnalysis(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  return await prisma.customer.groupBy({
    by: ['source'],
    where: { 
      salesPersonId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true },
    _avg: { actualValue: true },
    _sum: { actualValue: true }
  })
}

async function getRevenueMetrics(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const [
    currentPeriod,
    previousPeriod
  ] = await Promise.all([
    prisma.customer.aggregate({
      where: { 
        salesPersonId,
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
        salesPersonId,
        createdAt: {
          gte: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
          lte: dateRange.start
        }
      },
      _sum: { actualValue: true },
      _count: { id: true }
    })
  ])

  const currentRevenue = currentPeriod._sum.actualValue || 0
  const previousRevenue = previousPeriod._sum.actualValue || 0
  const revenueGrowth = previousRevenue > 0 ? ((Number(currentRevenue) - Number(previousRevenue)) / Number(previousRevenue)) * 100 : 0

  return {
    currentRevenue,
    previousRevenue,
    revenueGrowth,
    customerGrowth: previousPeriod._count.id > 0 ? ((currentPeriod._count.id - previousPeriod._count.id) / previousPeriod._count.id) * 100 : 0
  }
}

async function getActivitySummary(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const activities = await prisma.salesActivity.groupBy({
    by: ['type'],
    where: { 
      salesPersonId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  return activities.map((activity: any) => ({
    type: activity.type,
    count: activity._count.id
  }))
}

async function getConversionFunnel(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const funnel = await prisma.customer.groupBy({
    by: ['status'],
    where: { 
      salesPersonId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    _count: { id: true }
  })

  // Define funnel order
  const funnelOrder = ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED']
  
  return funnelOrder.map(status => {
    const stage = funnel.find((f: any) => f.status === status)
    return {
      stage: status,
      count: stage ? stage._count.id : 0
    }
  })
}

async function getTimeSeriesData(salesPersonId: string, dateRange: { start: Date; end: Date }) {
  const dailyCustomers = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
      SUM(actual_value) as revenue
    FROM customers
    WHERE sales_person_id = ${salesPersonId}
      AND created_at >= ${dateRange.start}
      AND created_at <= ${dateRange.end}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  return dailyCustomers
}
