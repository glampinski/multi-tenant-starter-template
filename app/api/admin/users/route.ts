import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { MODULES, ACTIONS } from '@/types/permissions'
import { withTenantContext, getTenantId } from '@/lib/tenant-context'

// GET: Fetch all users (Super Admin only)
export async function GET(req: NextRequest) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const session = await getServerSession(authOptions)
      const tenantId = getTenantId(enhancedReq)
      
      // Check if user is super admin
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Get user profile to check role with tenant isolation
      const userProfile = await (prisma.userProfile.findFirst as any)({
        where: { 
          id: session.user.id,
          tenantId
        },
        select: { role: true, teamId: true }
      })

      if (!userProfile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      if (userProfile?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
      }

      // Additional permission check for team management
      const canManageTeam = await hasPermission(
        session.user.id, 
        tenantId,
        userProfile.teamId!, 
        MODULES.TEAM_MANAGEMENT, 
        ACTIONS.MANAGE
      )

      if (!canManageTeam) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage users' }, { status: 403 })
      }

      const { searchParams } = new URL(enhancedReq.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const search = searchParams.get('search') || ''

      const skip = (page - 1) * limit

      // Build where clause with tenant isolation
      const where: any = {
        tenantId // Always filter by tenant
      }
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Fetch users with pagination and tenant isolation
      const [users, totalCount] = await Promise.all([
        (prisma.userProfile.findMany as any)({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            teamId: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            referralCode: true,
            lastLoginAt: true
          }
        }),
        (prisma.userProfile.count as any)({ where })
      ])

      const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
  })
}
