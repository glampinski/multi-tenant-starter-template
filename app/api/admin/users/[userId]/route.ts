import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { MODULES, ACTIONS, ROLES } from '@/types/permissions'

// GET: Get user details for role editing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user profile
    const adminProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id },
      select: { role: true, teamId: true }
    })

    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    // Check if user has permission to manage team
    const canManageTeam = await hasPermission(
      session.user.id, 
      adminProfile.teamId!, 
      MODULES.TEAM_MANAGEMENT, 
      ACTIONS.MANAGE
    )

    if (!canManageTeam) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage users' }, { status: 403 })
    }

    // Fetch the target user
    const user = await prisma.userProfile.findFirst({
      where: { 
        id: userId,
        teamId: adminProfile.teamId // Ensure user is in same team
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found in your team' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
        teamId: user.teamId,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching user for role edit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update user role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId } = await params
    const { role } = await req.json()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    // Get admin user profile
    const adminProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id },
      select: { role: true, teamId: true }
    })

    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    // Check if user has permission to manage team
    const canManageTeam = await hasPermission(
      session.user.id, 
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
    const targetUser = await prisma.userProfile.findFirst({
      where: { 
        id: userId,
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
      const superAdminCount = await prisma.userProfile.count({
        where: { 
          role: ROLES.SUPER_ADMIN,
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
    await prisma.securityAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'ROLE_CHANGE',
        resource: `user:${userId}`,
        details: {
          previousRole: targetUser.role,
          newRole: role,
          targetUserId: userId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    }).catch(error => {
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
}
