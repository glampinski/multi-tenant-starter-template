import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { MODULES, ACTIONS, ROLES } from '@/types/permissions'
import { withTenantContext, getTenantId } from '@/lib/tenant-context'

// PUT: Update user role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withTenantContext(req, async (enhancedReq) => {
    try {
      const session = await getServerSession(authOptions)
      const { userId } = await params
      const { role } = await enhancedReq.json()
      const tenantId = getTenantId(enhancedReq)
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
      }

      // Validate role
      if (!Object.values(ROLES).includes(role)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
      }

      // Get admin user profile with tenant isolation
      const adminProfile = await (prisma.userProfile.findFirst as any)({
        where: { 
          id: session.user.id,
          tenantId
        },
        select: { role: true, teamId: true }
      })

      if (!adminProfile) {
        return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
      }

      // Check if user has permission to manage team
      const canManageTeam = await hasPermission(
        session.user.id, 
        tenantId,
        adminProfile.teamId!, 
        MODULES.TEAM_MANAGEMENT, 
        ACTIONS.MANAGE
      )

    if (!canManageTeam) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage users' }, { status: 403 })
    }

    // Prevent non-super-admins from creating/modifying super admins
    if (role === ROLES.SUPER_ADMIN && adminProfile.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Forbidden: Only Super Admins can assign Super Admin role' 
      }, { status: 403 })
    }

    // Fetch the target user to ensure they exist and are in the same team
    const targetUser = await (prisma.userProfile.findFirst as any)({
      where: { 
        id: userId,
        tenantId,
        teamId: adminProfile.teamId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in your team' }, { status: 404 })
    }

    // Prevent users from modifying their own role (except super admins)
    if (userId === session.user.id && adminProfile.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'You cannot modify your own role' 
      }, { status: 403 })
    }

    // Prevent demotion of the last super admin
    if (targetUser.role === ROLES.SUPER_ADMIN && role !== ROLES.SUPER_ADMIN) {
      const superAdminCount = await (prisma.userProfile.count as any)({
        where: { 
          role: ROLES.SUPER_ADMIN,
          tenantId,
          teamId: adminProfile.teamId
        }
      })

      if (superAdminCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot demote the last Super Admin in the team' 
        }, { status: 403 })
      }
    }

    // Update the user's role
    const updatedUser = await prisma.userProfile.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    // Create audit log entry
    await (prisma.securityAuditLog.create as any)({
      data: {
        userId: session.user.id,
        tenantId,
        action: 'ROLE_CHANGE',
        resource: `user:${userId}`,
        details: {
          previousRole: targetUser.role,
          newRole: role,
          targetUserId: userId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        },
        ipAddress: enhancedReq.headers.get('x-forwarded-for') || enhancedReq.headers.get('x-real-ip') || 'unknown',
        userAgent: enhancedReq.headers.get('user-agent') || 'unknown'
      }
    }).catch((error: any) => {
      // Log audit creation error but don't fail the request
      console.error('Failed to create audit log:', error)
    })

    return NextResponse.json({ 
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}
