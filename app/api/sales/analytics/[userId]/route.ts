import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTenantContext, getTenantId } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { MODULES, ACTIONS } from '@/types/permissions'

async function getSalesAnalyticsHandler(
  enhancedReq: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const tenantId = getTenantId(enhancedReq)
    const { userId } = await params

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    // TODO: Get user profile from session for permission checks
    // For now, we'll skip permission checks until we integrate tenant-aware auth
    // const canViewSales = await hasPermission(
    //   userProfile.id, 
    //   tenantId,
    //   teamId, 
    //   MODULES.SALES, 
    //   ACTIONS.VIEW
    // )

    // if (!canViewSales) {
    //   return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view sales analytics' }, { status: 403 })
    // }

    const { searchParams } = new URL(enhancedReq.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Verify the requested user exists and belongs to the same tenant
    const targetUser = await (prisma.userProfile.findFirst as any)({
      where: { 
        id: userId,
        tenantId: tenantId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
    }

    // TODO: Add permission checks when we have session-based auth
    // Check permissions - sales people can only see their own analytics
    // if (userProfile.role === 'SALES_PERSON' && userId !== userProfile.id) {
    //   return NextResponse.json({ error: 'Unauthorized to view this user\'s analytics' }, { status: 403 })
    // }

    const dateRange = getDateRange(timeframe)
    
        // Get basic sales metrics with tenant isolation
    const [
      totalCustomers,
      newLeads,
      activeCustomers,
      totalRevenue
    ] = await Promise.all([
      (prisma.customer.count as any)({
        where: { 
          salesPersonId: userId,
          tenantId: tenantId
        }
      }),
      (prisma.customer.count as any)({
        where: { 
          salesPersonId: userId,
          tenantId: tenantId,
          status: 'LEAD',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      (prisma.customer.count as any)({
        where: { 
          salesPersonId: userId,
          tenantId: tenantId,
          status: 'ACTIVE'
        }
      }),
      (prisma.customer.aggregate as any)({
        where: { 
          salesPersonId: userId,
          tenantId: tenantId,
          actualValue: { not: null }
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withTenantContext(req, async (enhancedReq) => {
    return getSalesAnalyticsHandler(enhancedReq, { params })
  })
}
