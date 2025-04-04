import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { loggers, getRequestId, createSampledLogger } from './lib/logger';

// Create a sampled logger for middleware with 10% sampling rate for high-volume paths
const logger = createSampledLogger(loggers.middleware, 0.1);

// Define public routes
const publicRoutes = ['/', '/login', '/about', '/api/health', '/manifest.webmanifest'];

// Also explicitly allow the OAuth callback URLs
const allowedCallbacks = ['/api/auth/callback', '/api/auth/callback/google'];

// Check if the current path is a public route
const isPublicRoute = (path: string) => {
  return (
    publicRoutes.some(route => route === path) ||
    allowedCallbacks.some(callbackPath => path.startsWith(callbackPath))
  );
};

/**
 * Determines if the request is from a Playwright test and has valid test auth
 * @param request The incoming request
 * @returns Object with isPlaywrightTest and hasValidTestAuth flags
 */
function getPlaywrightTestContext(request: NextRequest) {
  // Check if this is a Playwright test
  const isPlaywrightTest =
    request.headers.get('user-agent')?.includes('Playwright') ||
    request.cookies.has('__playwright_test');

  if (!isPlaywrightTest) {
    return { isPlaywrightTest: false, hasValidTestAuth: false };
  }

  // Check for valid test auth tokens
  const mockSessionToken = request.cookies.get('next-auth.session-token')?.value;
  const hasFirebaseAuthData = request.cookies.get('firebase-auth-test')?.value === 'true';
  const hasValidTestAuth = mockSessionToken === 'mock-session-token' || hasFirebaseAuthData;

  return { isPlaywrightTest, hasValidTestAuth };
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = getRequestId();
  const startTime = Date.now();

  // Create request-specific logger with request ID
  const reqLogger = logger.child({ requestId, path: pathname });

  // Use standard rate for important events, sampled rate for routine events
  const isHighTrafficPath = pathname.startsWith('/api/auth') || pathname.includes('.');

  // Only log detailed request info for non-static resources to reduce noise
  if (!isHighTrafficPath) {
    reqLogger.info({
      msg: 'Request started',
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });
  } else {
    // For high-traffic paths, use trace level with minimal info
    reqLogger.trace({
      msg: 'Static request',
      method: request.method,
      path: pathname,
    });
  }

  // Skip API auth routes to avoid the NextAuth error
  if (pathname.startsWith('/api/auth')) {
    reqLogger.trace('Skipping API auth route');
    return NextResponse.next();
  }

  // Skip file requests
  if (pathname.includes('.')) {
    reqLogger.trace('Skipping file request');
    return NextResponse.next();
  }

  // Handle Playwright test authentication
  const { isPlaywrightTest, hasValidTestAuth } = getPlaywrightTestContext(request);

  // For E2E testing with valid auth tokens, allow auth bypass
  if (isPlaywrightTest) {
    if (hasValidTestAuth) {
      reqLogger.info({
        msg: 'Playwright test with valid auth detected',
        path: pathname,
      });

      // For protected routes, allow access
      if (!isPublicRoute(pathname)) {
        return NextResponse.next();
      }

      // For login page, redirect to dashboard
      if (pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      reqLogger.debug('Playwright test detected but without valid auth tokens');
    }
  }

  // Standard auth flow for non-test requests
  // Get token
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Only log auth status for user-facing pages, not assets or API calls
  if (!isHighTrafficPath) {
    reqLogger.debug({
      msg: 'Auth status',
      isPublicRoute: isPublicRoute(pathname),
      isAuthenticated,
      userId: token?.sub,
    });
  }

  // Redirect authenticated users from login to dashboard
  if (isAuthenticated && pathname === '/login') {
    reqLogger.info({
      msg: 'Redirecting authenticated user from login to dashboard',
      userId: token.sub,
    });
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute(pathname) && !isAuthenticated) {
    reqLogger.info({
      msg: 'Redirecting unauthenticated user to login',
      redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname + search)}`,
    });
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // Allow access for public routes or authenticated users
  const response = NextResponse.next();

  // Log request completion only for non-static resources
  if (!isHighTrafficPath) {
    const duration = Date.now() - startTime;
    reqLogger.info({
      msg: 'Request completed',
      duration,
      isPublicRoute: isPublicRoute(pathname),
      isAuthenticated,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
