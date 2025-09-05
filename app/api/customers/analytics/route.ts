import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTeamContext, TeamContextRequest } from '@/lib/teamContext'

async function getCustomerAnalyticsHandler(req: TeamContextRequest) {
  try {
    const { userProfile, teamId } = req
    
    if (!userProfile || !teamId) {
      return NextResponse.json({ error: 'Team context required' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const salesPersonId = searchParams.get('salesPersonId') || userProfile.id
    const timeframe = searchParams.get('timeframe') || '30d'

    // Validate that the sales person is in the same team
    if (salesPersonId !== userProfile.id) {
      const salesPerson = await prisma.userProfile.findFirst({
        where: {
          id: salesPersonId,
          teamId: teamId
        }
      })

      if (!salesPerson) {
        return NextResponse.json({ error: 'Sales person not found in this team' }, { status: 404 })
      }

      // Permission check: only admins can view other people's analytics
      if (userProfile.role === 'CUSTOMER' || userProfile.role === 'SALES_PERSON') {
        return NextResponse.json({ error: 'Forbidden - Can only view own analytics' }, { status: 403 })
      }
    }

    // Calculate date range
    const dateRange = getDateRange(timeframe)

    // Get customer analytics within team scope
    const [customers, activities, totalRevenue, statusBreakdown] = await Promise.all([
      // Get customers managed by this sales person in this team
      prisma.customer.findMany({
        where: {
          salesPersonId: salesPersonId,
          teamId: teamId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: {
          activities: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            }
          }
        }
      }),

      // Get sales activities for this sales person in this team
      prisma.salesActivity.findMany({
        where: {
          salesPersonId: salesPersonId,
          teamId: teamId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),

      // Calculate total revenue for this sales person in this team
      prisma.customer.aggregate({
        where: {
          salesPersonId: salesPersonId,
          teamId: teamId
        },
        _sum: {
          actualValue: true,
          estimatedValue: true
        }
      }),

      // Status breakdown
      prisma.customer.groupBy({
        by: ['status'],
        where: {
          salesPersonId: salesPersonId,
          teamId: teamId
        },
        _count: {
          id: true
        }
      })
    ])

    // Calculate analytics
    const totalCustomers = customers.length
    const totalActivities = activities.length
    const newCustomers = customers.filter(c => 
      c.createdAt >= dateRange.start && c.createdAt <= dateRange.end
    ).length

    const totalRevenueValue = Number(totalRevenue._sum?.actualValue || 0) + Number(totalRevenue._sum?.estimatedValue || 0)
    const avgDealSize = totalCustomers > 0 ? totalRevenueValue / totalCustomers : 0

    // Activity type breakdown
    const activityBreakdown = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Status distribution
    const statusDistribution = statusBreakdown.reduce((acc, status) => {
      acc[status.status] = status._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      analytics: {
        summary: {
          totalCustomers,
          newCustomers,
          totalActivities,
          totalRevenue: totalRevenueValue,
          averageDealSize: Math.round(avgDealSize * 100) / 100
        },
        statusDistribution,
        activityBreakdown,
        customers: customers.map(customer => ({
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          status: customer.status,
          actualValue: Number(customer.actualValue || 0),
          estimatedValue: Number(customer.estimatedValue || 0),
          source: customer.source,
          createdAt: customer.createdAt,
          activitiesCount: customer.activities.length
        })),
        recentActivities: activities.slice(0, 10).map(activity => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          outcome: activity.outcome,
          createdAt: activity.createdAt
        }))
      },
      teamId,
      salesPersonId,
      timeframe
    })

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

export const GET = withTeamContext(getCustomerAnalyticsHandler)
