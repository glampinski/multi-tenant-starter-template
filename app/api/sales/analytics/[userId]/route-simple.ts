import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTeamContext, TeamContextRequest, getTeamContext } from '@/lib/teamContext'

async function getSalesAnalyticsHandler(
  req: TeamContextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { teamId, userProfile } = getTeamContext(req)
    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Verify the requested user exists and belongs to the same team
    const targetUser = await prisma.userProfile.findFirst({
      where: { 
        id: userId,
        teamId: teamId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in your team' }, { status: 404 })
    }

    // Check permissions - sales people can only see their own analytics
    if (userProfile.role === 'SALES_PERSON' && userId !== userProfile.id) {
      return NextResponse.json({ error: 'Unauthorized to view this user\'s analytics' }, { status: 403 })
    }

    const dateRange = getDateRange(timeframe)
    
    // Get basic sales metrics with team isolation
    const [
      totalCustomers,
      newLeads,
      activeCustomers,
      totalRevenue
    ] = await Promise.all([
      prisma.customer.count({
        where: { 
          salesPersonId: userId,
          teamId: teamId
        }
      }),
      prisma.customer.count({
        where: { 
          salesPersonId: userId,
          teamId: teamId,
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
          teamId: teamId,
          status: 'ACTIVE'
        }
      }),
      prisma.customer.aggregate({
        where: { 
          salesPersonId: userId,
          teamId: teamId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _sum: { actualValue: true }
      })
    ])

    const analytics = {
      performance: {
        totalCustomers,
        newLeads,
        activeCustomers,
        totalRevenue: totalRevenue._sum.actualValue || 0,
        conversionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
      },
      pipeline: {
        leads: newLeads,
        active: activeCustomers,
        conversion: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
      },
      activities: {
        totalActivities: 0, // Will be implemented later
        callsMade: 0,
        emailsSent: 0,
        meetingsHeld: 0
      },
      timeframe,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      }
    }

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

export const GET = withTeamContext(getSalesAnalyticsHandler)
