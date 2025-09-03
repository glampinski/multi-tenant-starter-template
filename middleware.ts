import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next();
  }

  // Check for development session cookie
  const devSession = request.cookies.get('dev_session');
  
  if (devSession) {
    try {
      const session = JSON.parse(devSession.value);
      
      // Check if session is still valid
      if (session.isDev && session.exp > Date.now()) {
        // Create a response that sets Stack Auth bypass headers
        const response = NextResponse.next();
        
        // Add custom headers to bypass Stack Auth for development
        response.headers.set('x-dev-authenticated', 'true');
        response.headers.set('x-dev-user-id', session.userId);
        response.headers.set('x-dev-user-email', session.email);
        response.headers.set('x-dev-user-role', session.role);
        response.headers.set('x-dev-team-id', session.teamId);
        
        return response;
      }
    } catch (error) {
      console.error('Invalid dev session cookie:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except API routes, static files, and _next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
