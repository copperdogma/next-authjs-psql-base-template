// =============================================================================
// Unit Testing Note:
// Unit testing Next.js Middleware, especially involving authentication logic
// and interaction with NextRequest/NextResponse objects (Edge Runtime), is
// notoriously difficult due to environment limitations and mocking challenges.
// Attempts to unit test this middleware encountered persistent issues like
// 'ReferenceError: Request is not defined'.
//
// Validation Strategy:
// Middleware functionality (route protection, redirects, public/private access)
// is primarily validated through End-to-End (E2E) tests that simulate user
// navigation and verify the resulting behavior in a browser context.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getToken, JWT as NextAuthJWT } from 'next-auth/jwt';
import * as pino from 'pino';
import { getRequestId, loggers } from './lib/logger';

// Create a logger for middleware
const logger = loggers.middleware;

// Define public and protected paths
const publicPaths = [
  '/',
  '/login',
  '/about',
  '/api/health',
  '/api/auth/**',
  '/api/log/client',
  '/api/test/**',
];

const protectedPaths = ['/dashboard', '/profile', '/settings'];

interface TokenService {
  getToken(options: { req: NextRequest }): Promise<NextAuthJWT | null>;
}

// Create a default token service using NextAuth getToken
const defaultTokenService: TokenService = {
  getToken: options => getToken(options),
};

/**
 * Checks if a path is in the public paths list
 * @private // Marked private originally, now exporting for testing
 */
export function isPublic(pathname: string): boolean {
  // First check direct matches
  if (publicPaths.some(path => path === pathname)) {
    return true;
  }

  // Then check pattern matches (wildcard paths with **)
  if (
    publicPaths.some(pattern => {
      if (typeof pattern === 'string' && pattern.includes('**')) {
        const prefix = pattern.replace('/**', '');
        return pathname.startsWith(prefix);
      }
      return false;
    })
  ) {
    return true;
  }

  // Check if it's a static asset or Next.js internal route
  if (pathname.startsWith('/_next/') || pathname.includes('.') || pathname === '/favicon.ico') {
    return true;
  }

  // Check if it's explicitly protected
  if (protectedPaths.some(path => path === pathname || pathname.startsWith(path + '/'))) {
    return false;
  }

  // By default, let's be more strict and consider unknown paths as protected
  return false;
}

/**
 * Handle routes that should be skipped for auth processing
 * @private // Marked private originally, now exporting for testing
 */
export function handleSkippableRoutes(
  pathname: string,
  reqLogger: pino.Logger
): NextResponse | null {
  // Skip API routes - they handle their own auth
  if (pathname.startsWith('/api/')) {
    reqLogger.debug({ msg: 'Skipping API route' });
    return NextResponse.next();
  }

  // Skip static files and other non-page routes
  if (pathname.startsWith('/_next/') || pathname.includes('.') || pathname === '/favicon.ico') {
    reqLogger.debug({ msg: 'Skipping static asset' });
    return NextResponse.next();
  }

  return null;
}

/**
 * Request context to share data between functions
 */
interface RequestContext {
  pathname: string;
  search: string;
  reqLogger: pino.Logger;
  isHighTrafficPath: boolean;
}

/**
 * Handle standard authentication logic
 */
async function handleStandardAuth(
  request: NextRequest,
  context: RequestContext,
  tokenService: TokenService
): Promise<NextResponse | null> {
  const { pathname, reqLogger } = context;

  // Use injected token service to check authentication
  const token = await tokenService.getToken({ req: request });
  const isAuthenticated = !!token;

  // Debug authentication status
  reqLogger.debug({ msg: 'Auth status', isAuthenticated, userId: token?.sub });

  // For public pages
  if (isPublic(pathname)) {
    // If logged in user tries to access login page, redirect to dashboard
    if (isAuthenticated && pathname === '/login') {
      reqLogger.debug({ msg: 'Redirecting authenticated user from login to dashboard' });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // For protected pages
  if (!isAuthenticated) {
    // Redirect to login with callbackUrl
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(`${pathname}${context.search}`));

    reqLogger.debug({ msg: 'Redirecting unauthenticated user to login', from: pathname });
    return NextResponse.redirect(url);
  }

  // Protected route with valid authentication
  return NextResponse.next();
}

/**
 * Log request details based on path type
 */
function logRequest(
  reqLogger: pino.Logger,
  request: NextRequest,
  _pathname: string,
  isHighTrafficPath: boolean
) {
  if (isHighTrafficPath) {
    // For high-traffic paths, log at trace level with minimal info
    reqLogger.trace({
      msg: 'Request',
      method: request.method,
    });
  } else {
    // For normal paths, log at info level with more details
    reqLogger.info({
      msg: 'Request',
      method: request.method,
      referrer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
  }
}

/**
 * Log request completion with timing
 */
function logRequestCompletion(
  context: RequestContext,
  startTime: number,
  isAuthenticated: boolean
) {
  const { reqLogger, isHighTrafficPath } = context;
  const duration = Date.now() - startTime;

  // For high-traffic paths, log at debug level only if slow
  if (isHighTrafficPath) {
    if (duration > 100) {
      reqLogger.debug({
        msg: 'Slow static request completed',
        durationMs: duration,
        isAuth: isAuthenticated,
      });
    }
    return;
  }

  // For normal paths, log completion at info level
  reqLogger.info({
    msg: 'Request completed',
    durationMs: duration,
    isAuth: isAuthenticated,
  });
}

/**
 * Process authentication flow
 */
async function processAuthentication(
  request: NextRequest,
  context: RequestContext,
  startTime: number,
  tokenService: TokenService = defaultTokenService
): Promise<{ isAuthenticated: boolean; response: NextResponse | null }> {
  // Standard authentication
  const standardAuthResponse = await handleStandardAuth(request, context, tokenService);

  // Determine if user is authenticated
  const token = await tokenService.getToken({ req: request });
  const isAuthenticated = !!token;

  // Log request completion
  logRequestCompletion(context, startTime, isAuthenticated);

  return { isAuthenticated, response: standardAuthResponse };
}

/**
 * Process the request with all middleware steps
 */
async function processRequest(
  request: NextRequest,
  context: RequestContext,
  startTime: number,
  tokenService: TokenService = defaultTokenService
): Promise<NextResponse> {
  const { pathname, reqLogger } = context;

  // Handle skippable routes first (API, static assets)
  const skipResponse = handleSkippableRoutes(pathname, reqLogger);
  if (skipResponse) {
    logRequestCompletion(context, startTime, false); // Log completion for skipped routes
    return skipResponse;
  }

  // Process authentication
  const { isAuthenticated, response: authResponse } = await processAuthentication(
    request,
    context,
    startTime,
    tokenService
  );

  // Log completion (after auth)
  logRequestCompletion(context, startTime, isAuthenticated);

  // Return the response determined by auth logic
  // If auth logic didn't return a specific response (e.g., allowed access), it means NextResponse.next() was intended.
  return authResponse || NextResponse.next();
}

/**
 * Main middleware function executed for each request
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = getRequestId();

  // Extract path information
  const url = new URL(request.url);
  const { pathname, search } = url;

  // Create a request-specific logger with the request ID
  const reqLogger = logger.child({ requestId, path: pathname });

  // Determine if this is a high-traffic path (static assets, etc.)
  const isHighTrafficPath = pathname.startsWith('/_next/') || pathname.includes('.');

  // Log request details
  logRequest(reqLogger, request, pathname, isHighTrafficPath);

  // Create context object with request information
  const context: RequestContext = {
    pathname,
    search,
    reqLogger,
    isHighTrafficPath,
  };

  try {
    // Process the request with default token service
    return await processRequest(request, context, startTime, defaultTokenService);
  } catch (error) {
    // Handle errors
    logger.error({ error, requestId, path: pathname, msg: 'Middleware error' });
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Apply middleware ONLY to the paths explicitly listed here.
    // Public paths are included to handle redirects (e.g., logged-in user visiting /login).
    // Protected paths are included to enforce authentication.
    '/',
    '/login',
    '/about',
    '/api/health',
    '/api/auth/:path*',
    '/api/log/client',
    '/api/test/:path*',
    '/dashboard',
    '/profile',
    '/settings',
  ],
};
