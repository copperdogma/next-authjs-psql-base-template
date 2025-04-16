/**
 * MOCK FILE for testing
 * This is a mock replacement for the removed Firebase auth middleware
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration options for the auth middleware
 */
export interface AuthMiddlewareOptions {
  /**
   * Routes that require authentication
   */
  protectedRoutes?: string[];

  /**
   * Routes to skip authentication for
   */
  publicRoutes?: string[];

  /**
   * Where to redirect unauthenticated users
   */
  loginUrl?: string;

  /**
   * Where to redirect logged in users when accessing login page
   */
  defaultLoggedInRedirect?: string;
}

/**
 * Default middleware options
 */
export const DEFAULT_AUTH_MIDDLEWARE_OPTIONS: AuthMiddlewareOptions = {
  protectedRoutes: ['/dashboard', '/profile', '/api/user'],
  publicRoutes: ['/', '/login', '/api/auth', '/api/health'],
  loginUrl: '/login',
  defaultLoggedInRedirect: '/dashboard',
};

/**
 * Creates a middleware function for handling authentication
 */
export function createAuthMiddleware(
  options: AuthMiddlewareOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const {
    protectedRoutes = DEFAULT_AUTH_MIDDLEWARE_OPTIONS.protectedRoutes,
    publicRoutes = DEFAULT_AUTH_MIDDLEWARE_OPTIONS.publicRoutes,
    loginUrl = DEFAULT_AUTH_MIDDLEWARE_OPTIONS.loginUrl,
    defaultLoggedInRedirect = DEFAULT_AUTH_MIDDLEWARE_OPTIONS.defaultLoggedInRedirect,
  } = options;

  return async function authMiddleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // For testing, simulate the authentication check
    const isAuthenticated = req.cookies.has('mock-auth-cookie');

    // Check if the user is trying to access a protected route
    const isProtectedRoute = protectedRoutes?.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the route is a public route that doesn't need authentication
    const isPublicRoute = publicRoutes?.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if accessing login page while authenticated
    if (isAuthenticated && pathname === loginUrl) {
      return NextResponse.redirect(new URL(defaultLoggedInRedirect || '/dashboard', req.url));
    }

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to login if accessing protected route while not authenticated
    if (isProtectedRoute && !isAuthenticated) {
      const loginUrlWithCallback = new URL(loginUrl || '/login', req.url);
      loginUrlWithCallback.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrlWithCallback);
    }

    // Otherwise, continue
    return NextResponse.next();
  };
}

/**
 * Pre-configured auth middleware with default options
 */
export const authMiddleware = createAuthMiddleware();
