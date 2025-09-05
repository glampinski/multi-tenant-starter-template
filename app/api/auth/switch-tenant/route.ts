import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TenantManager } from '@/lib/tenant-manager'

/**
 * POST /api/auth/switch-tenant
 * Switch the user's active tenant context (for future multi-tenant user support)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { tenantId } = await request.json()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Validate user has access to the requested tenant
    const hasAccess = await TenantManager.validateUserTenantAccess(
      session.user.id, 
      tenantId
    )
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this tenant' },
        { status: 403 }
      )
    }

    // For now, users only have access to their primary tenant
    // In the future, this endpoint will update the session with the new tenant context
    // and potentially update user preferences for multi-tenant support
    
    return NextResponse.json({
      success: true,
      message: 'Tenant switch successful',
      tenantId
    })

  } catch (error) {
    console.error('Error switching tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
