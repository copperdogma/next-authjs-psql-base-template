import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  // Routes that require authentication (must be logged in)
  protectedRoutes: string[];
  // Routes that require no authentication (login page, etc.)
  publicRoutes: string[];
  // Default redirect path after login
  defaultAuthenticatedRedirect: string;
  // Login path
  loginPath: string;
}

const DEFAULT_OPTIONS: AuthMiddlewareOptions = {
  protectedRoutes: ['/dashboard', '/profile', '/settings'],
  publicRoutes: ['/login', '/register', '/forgot-password', '/api/health'],
  defaultAuthenticatedRedirect: '/dashboard',
  loginPath: '/login',
};

/**
 * Create a middleware handler for authentication
 * @param options Configuration options
 * @returns A middleware handler function
 */
export function createAuthMiddleware(options: Partial<AuthMiddlewareOptions> = {}) {
  // Merge provided options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options };

  return function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route is protected or public
    const isProtectedRoute = config.protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    const isPublicRoute = config.publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Get the session token from the request - check for Firebase session cookie
    const sessionToken = request.cookies.get('session');
    const isAuthenticated = !!sessionToken;

    // If it's a protected route and there's no session token, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
      const loginUrl = new URL(config.loginPath, request.url);
      // Fix double encoding issue by not using encodeURIComponent
      // The URL object and searchParams.set already handle basic encoding
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If it's a public route and user is authenticated, redirect to default authenticated page
    if (isPublicRoute && isAuthenticated) {
      const redirectUrl = new URL(config.defaultAuthenticatedRedirect, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  };
}

// Export a pre-configured middleware for convenience
export const authMiddleware = createAuthMiddleware(); 