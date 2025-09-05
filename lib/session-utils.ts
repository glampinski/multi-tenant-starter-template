import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"
import { TenantManager } from "@/lib/tenant-manager"

export interface SessionWithTenant {
  user: {
    id: string
    email: string
    role: string
    teamId: string | null
    lineagePath: string[]
    inviteVerified: boolean
    tenantId: string
    tenant: {
      id: string
      name: string
      slug: string
      status: string
      plan: string
    }
    accessibleTenants?: Array<{
      id: string
      name: string
      slug: string
      role: string
    }>
  }
}

/**
 * Get session with tenant context for API routes
 * This function ensures the user is authenticated and has valid tenant access
 */
export async function getSessionWithTenant(): Promise<SessionWithTenant | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return null
    }

    // Verify the session has tenant information
    if (!session.user.tenantId || !session.user.tenant) {
      console.error('❌ Session missing tenant context:', {
        userId: session.user.id,
        email: session.user.email
      })
      return null
    }

    // Additional security check: verify user still has access to tenant
    const hasAccess = await TenantManager.validateUserTenantAccess(
      session.user.id, 
      session.user.tenantId
    )

    if (!hasAccess) {
      console.error('❌ User no longer has access to tenant:', {
        userId: session.user.id,
        tenantId: session.user.tenantId
      })
      return null
    }

    return session as SessionWithTenant
  } catch (error) {
    console.error('❌ Error getting session with tenant:', error)
    return null
  }
}

/**
 * Validate user has access to a specific tenant
 * Useful for cross-tenant operations or tenant switching
 */
export async function validateTenantAccess(
  userId: string, 
  targetTenantId: string
): Promise<boolean> {
  try {
    return await TenantManager.validateUserTenantAccess(userId, targetTenantId)
  } catch (error) {
    console.error('❌ Error validating tenant access:', error)
    return false
  }
}

/**
 * Get tenant context from request headers
 * Useful for middleware or when session isn't available
 */
export function getTenantContextFromRequest(request: NextRequest): {
  tenantId?: string
  tenantSlug?: string
  tenantDomain?: string
} {
  const tenantId = request.headers.get('x-tenant-id')
  const tenantSlug = request.headers.get('x-tenant-slug')
  const tenantDomain = request.headers.get('x-tenant-domain')

  return {
    tenantId: tenantId || undefined,
    tenantSlug: tenantSlug || undefined,
    tenantDomain: tenantDomain || undefined
  }
}

/**
 * Require tenant-aware session or throw error
 * Useful for protecting API routes
 */
export async function requireTenantSession(): Promise<SessionWithTenant> {
  const session = await getSessionWithTenant()
  
  if (!session) {
    throw new Error('Authentication required')
  }

  return session
}
