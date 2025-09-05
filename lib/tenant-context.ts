import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TenantStatus } from '@prisma/client'
import { headers } from 'next/headers'

export interface TenantContext {
  id: string
  name: string
  slug: string
  domain: string | null
  status: TenantStatus
  plan: string
  settings: any
  primaryColor: string | null
  secondaryColor: string | null
  logoUrl: string | null
}

export interface EnhancedRequest extends NextRequest {
  tenant?: TenantContext
  tenantId?: string
}

/**
 * Get tenant context from middleware headers (for use in pages and API routes)
 */
export async function getTenantFromHeaders(): Promise<TenantContext | null> {
  try {
    const headersList = await headers()
    const tenantSlug = headersList.get('x-tenant-slug')
    const tenantType = headersList.get('x-tenant-type')
    
    if (!tenantSlug) {
      return null
    }
    
    // Look up tenant in database based on the type
    const whereClause = tenantType === 'domain' 
      ? { domain: tenantSlug }
      : { slug: tenantSlug }
    
    const tenant = await prisma.tenant.findUnique({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        plan: true,
        settings: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true
      }
    })
    
    return tenant as TenantContext | null
  } catch (error) {
    console.error('Error getting tenant from headers:', error)
    return null
  }
}

/**
 * Enhanced middleware for tenant identification and context injection
 * Note: This is now used in API routes and pages, not middleware
 */
export async function withTenantContext(
  request: NextRequest,
  handler: (req: EnhancedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  let tenant: TenantContext | null = null
  
  // Extract tenant identifier from request
  const tenantIdentifier = await extractTenantIdentifier(request)
  
  if (tenantIdentifier) {
    try {
      // Get tenant from database
      const dbTenant = await prisma.tenant.findUnique({
        where: tenantIdentifier.type === 'slug' 
          ? { slug: tenantIdentifier.value }
          : { domain: tenantIdentifier.value },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true,
          plan: true,
          settings: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true
        }
      })
      
      if (dbTenant) {
        // Check if tenant is active
        if (dbTenant.status === TenantStatus.SUSPENDED) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Tenant suspended',
              message: 'This organization account has been suspended. Please contact support.'
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        if (dbTenant.status === TenantStatus.EXPIRED) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Tenant expired',
              message: 'This organization account has expired. Please renew your subscription.'
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        tenant = {
          id: dbTenant.id,
          name: dbTenant.name,
          slug: dbTenant.slug,
          domain: dbTenant.domain,
          status: dbTenant.status,
          plan: dbTenant.plan,
          settings: dbTenant.settings,
          primaryColor: dbTenant.primaryColor,
          secondaryColor: dbTenant.secondaryColor,
          logoUrl: dbTenant.logoUrl
        }
      }
    } catch (error) {
      console.error('Error fetching tenant:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tenant lookup failed',
          message: 'Unable to identify organization. Please try again.'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
  
  // For non-tenant-specific routes (like super admin), tenant might be null
  // This is acceptable for certain routes
  
  // Create enhanced request with tenant context
  const enhancedRequest = request as EnhancedRequest
  enhancedRequest.tenant = tenant || undefined
  enhancedRequest.tenantId = tenant?.id || undefined
  
  return await handler(enhancedRequest)
}

/**
 * Extract tenant identifier from various request sources
 */
async function extractTenantIdentifier(
  request: NextRequest
): Promise<{ type: 'slug' | 'domain'; value: string } | null> {
  const url = new URL(request.url)
  
  // Method 1: Custom domain (e.g., tenant.com)
  const hostname = url.hostname
  if (hostname && !isSystemDomain(hostname)) {
    return { type: 'domain', value: hostname }
  }
  
  // Method 2: Subdomain (e.g., tenant.yourapp.com)
  const subdomain = extractSubdomain(hostname)
  if (subdomain && subdomain !== 'www' && !isSystemSubdomain(subdomain)) {
    return { type: 'slug', value: subdomain }
  }
  
  // Method 3: Path-based (e.g., yourapp.com/tenant/...)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  if (pathSegments[0] && !isSystemPath(pathSegments[0])) {
    // Check if first path segment could be a tenant slug
    const potentialSlug = pathSegments[0]
    if (potentialSlug.match(/^[a-z0-9-]+$/)) {
      return { type: 'slug', value: potentialSlug }
    }
  }
  
  // Method 4: Header-based (for API calls)
  const tenantHeader = request.headers.get('x-tenant-slug') || request.headers.get('x-tenant-id')
  if (tenantHeader) {
    return { type: 'slug', value: tenantHeader }
  }
  
  // Method 5: Query parameter (fallback)
  const tenantParam = url.searchParams.get('tenant')
  if (tenantParam) {
    return { type: 'slug', value: tenantParam }
  }
  
  return null
}

/**
 * Check if hostname is a system domain (not a tenant domain)
 */
function isSystemDomain(hostname: string): boolean {
  const systemDomains = [
    'localhost',
    '127.0.0.1',
    process.env.NEXT_PUBLIC_APP_DOMAIN,
    process.env.VERCEL_URL
  ].filter(Boolean)
  
  return systemDomains.includes(hostname)
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  if (!appDomain || !hostname.endsWith(appDomain)) {
    return null
  }
  
  const subdomain = hostname.replace(`.${appDomain}`, '')
  return subdomain === appDomain ? null : subdomain
}

/**
 * Check if subdomain is a system subdomain (not a tenant)
 */
function isSystemSubdomain(subdomain: string): boolean {
  const systemSubdomains = ['api', 'admin', 'www', 'app', 'dashboard', 'auth']
  return systemSubdomains.includes(subdomain)
}

/**
 * Check if path segment is a system path (not a tenant)
 */
function isSystemPath(pathSegment: string): boolean {
  const systemPaths = [
    'api',
    'auth',
    'admin-panel',
    'dashboard',
    'role-demo',
    'welcome',
    'signup',
    '_next',
    'favicon.ico'
  ]
  return systemPaths.includes(pathSegment)
}

/**
 * Helper function to get tenant context from request in API routes
 */
export function getTenantContext(request: Request | EnhancedRequest): TenantContext | null {
  const enhancedReq = request as EnhancedRequest
  return enhancedReq.tenant || null
}

/**
 * Helper function to get tenant ID from request in API routes
 */
export function getTenantId(request: Request | EnhancedRequest): string | null {
  const enhancedReq = request as EnhancedRequest
  return enhancedReq.tenantId || null
}

/**
 * Validate that user belongs to the tenant
 */
export async function validateUserTenantAccess(
  userId: string, 
  tenantId: string
): Promise<boolean> {
  try {
    const user = await prisma.userProfile.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      }
    })
    return !!user
  } catch (error) {
    console.error('Error validating user tenant access:', error)
    return false
  }
}

/**
 * Get tenant-scoped database queries
 */
export function createTenantScopedQueries(tenantId: string) {
  return {
    users: {
      ...prisma.userProfile,
      findMany: (args?: any) => prisma.userProfile.findMany({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      findFirst: (args?: any) => prisma.userProfile.findFirst({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      count: (args?: any) => prisma.userProfile.count({
        ...args,
        where: { ...args?.where, tenantId }
      })
    },
    customers: {
      ...prisma.customer,
      findMany: (args?: any) => prisma.customer.findMany({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      findFirst: (args?: any) => prisma.customer.findFirst({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      count: (args?: any) => prisma.customer.count({
        ...args,
        where: { ...args?.where, tenantId }
      })
    },
    referrals: {
      ...prisma.referralRelationship,
      findMany: (args?: any) => prisma.referralRelationship.findMany({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      findFirst: (args?: any) => prisma.referralRelationship.findFirst({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      count: (args?: any) => prisma.referralRelationship.count({
        ...args,
        where: { ...args?.where, tenantId }
      })
    }
  }
}
