import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Always check for tenant context first
  const tenantContext = extractTenantContext(request);
  
  // Create response object
  let response = NextResponse.next();
  
  // Add tenant context headers if found
  if (tenantContext) {
    response.headers.set('x-tenant-slug', tenantContext.slug);
    response.headers.set('x-tenant-type', tenantContext.type);
    
    // Note: We can't validate tenant status in middleware (Edge Runtime)
    // Tenant status validation will be handled in API routes and pages
  }
  
  // Only run development bypass in development
  if (process.env.NODE_ENV === 'development') {
    response = addDevelopmentBypass(request, response);
  }

  return response;
}

/**
 * Extract tenant context from request (without database lookup)
 */
function extractTenantContext(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Method 1: Custom domain (e.g., tenant.com)
    const hostname = url.hostname;
    if (hostname && !isSystemDomain(hostname)) {
      return { type: 'domain' as const, slug: hostname };
    }
    
    // Method 2: Subdomain (e.g., tenant.yourapp.com)
    const subdomain = extractSubdomain(hostname);
    if (subdomain && subdomain !== 'www' && !isSystemSubdomain(subdomain)) {
      return { type: 'subdomain' as const, slug: subdomain };
    }
    
    // Method 3: Path-based (e.g., yourapp.com/tenant/...)
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments[0] && !isSystemPath(pathSegments[0])) {
      const potentialSlug = pathSegments[0];
      if (potentialSlug.match(/^[a-z0-9-]+$/)) {
        return { type: 'path' as const, slug: potentialSlug };
      }
    }
    
    // Method 4: Header-based (for API calls)
    const tenantHeader = request.headers.get('x-tenant-slug') || request.headers.get('x-tenant-id');
    if (tenantHeader) {
      return { type: 'header' as const, slug: tenantHeader };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting tenant context:', error);
    return null;
  }
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
  ].filter(Boolean);
  
  return systemDomains.includes(hostname);
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (!appDomain || !hostname.endsWith(appDomain)) {
    return null;
  }
  
  const subdomain = hostname.replace(`.${appDomain}`, '');
  return subdomain === appDomain ? null : subdomain;
}

/**
 * Check if subdomain is a system subdomain (not a tenant)
 */
function isSystemSubdomain(subdomain: string): boolean {
  const systemSubdomains = ['api', 'admin', 'www', 'app', 'dashboard', 'auth'];
  return systemSubdomains.includes(subdomain);
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
  ];
  return systemPaths.includes(pathSegment);
}

/**
 * Add development session bypass (existing functionality)
 */
function addDevelopmentBypass(request: NextRequest, response: NextResponse): NextResponse {
  const devSession = request.cookies.get('dev_session');
  
  if (devSession) {
    try {
      const session = JSON.parse(devSession.value);
      
      // Check if session is still valid
      if (session.isDev && session.exp > Date.now()) {
        // Add custom headers to bypass Stack Auth for development
        response.headers.set('x-dev-authenticated', 'true');
        response.headers.set('x-dev-user-id', session.userId);
        response.headers.set('x-dev-user-email', session.email);
        response.headers.set('x-dev-user-role', session.role);
        response.headers.set('x-dev-team-id', session.teamId);
      }
    } catch (error) {
      console.error('Invalid dev session cookie:', error);
    }
  }
  
  return response;
}

export const config = {
  // Match all routes except API routes, static files, and _next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
