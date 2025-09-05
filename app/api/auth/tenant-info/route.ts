import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TenantManager } from '@/lib/tenant-manager'

/**
 * GET /api/auth/tenant-info
 * Returns the current user's tenant information for the tenant switcher
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's tenant information
    const tenantInfo = await TenantManager.getUserTenantInfo(session.user.id)
    
    if (!tenantInfo) {
      return NextResponse.json(
        { error: 'No tenant information found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: tenantInfo.user,
      tenant: {
        id: tenantInfo.tenant.id,
        name: tenantInfo.tenant.name,
        slug: tenantInfo.tenant.slug,
        status: tenantInfo.tenant.status,
        plan: tenantInfo.tenant.plan
      }
    })

  } catch (error) {
    console.error('Error fetching tenant info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
