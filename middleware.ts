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
 */
function isPublic(pathname: string): boolean {
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
 * Checks if we're in a Playwright test environment via headers
 */
function getPlaywrightTestContext(request: NextRequest) {
  // Check for E2E test header
  const isE2eTest = request.headers.get('x-playwright-test') === 'true';

  // Check for auth test header
  const hasAuthTestHeader = request.headers.has('x-playwright-auth');
  const authTestUserId = request.headers.get('x-playwright-auth');

  // Check for specific test skip header
  const skipAuth = request.headers.get('x-playwright-skip-auth') === 'true';

  return {
    isE2eTest,
    hasAuthTestHeader,
    authTestUserId,
    skipAuth,
  };
}

/**
 * Handle routes that should be skipped for auth processing
 */
function handleSkippableRoutes(pathname: string, reqLogger: pino.Logger): NextResponse | null {
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
 * Handle Playwright test authentication
 */
async function handlePlaywrightTestAuth(
  request: NextRequest,
  pathname: string,
  reqLogger: pino.Logger
): Promise<NextResponse | null> {
  const { isE2eTest, hasAuthTestHeader, authTestUserId, skipAuth } =
    getPlaywrightTestContext(request);

  // Check if this is a test request
  if (!isE2eTest) {
    return null;
  }

  reqLogger.debug({ msg: 'Processing E2E test request' });

  // Skip auth for test routes if requested
  if (skipAuth) {
    reqLogger.debug({ msg: 'Skipping auth for E2E test by request' });
    return NextResponse.next();
  }

  // Handle test auth token
  if (hasAuthTestHeader && authTestUserId) {
    reqLogger.debug({ msg: 'Using E2E test auth', userId: authTestUserId });

    if (pathname === '/login') {
      // Redirect from login to dashboard for "authenticated" test users
      reqLogger.debug({ msg: 'Redirecting test user from login to dashboard' });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access to protected routes
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
  const { pathname, reqLogger } = context;

  // Check for routes that should skip auth
  const skipResponse = handleSkippableRoutes(pathname, reqLogger);
  if (skipResponse) {
    return { isAuthenticated: false, response: skipResponse };
  }

  // Check for Playwright test auth
  const testAuthResponse = await handlePlaywrightTestAuth(request, pathname, reqLogger);
  if (testAuthResponse) {
    return { isAuthenticated: false, response: testAuthResponse };
  }

  // Handle standard auth flow
  const authResponse = await handleStandardAuth(request, context, tokenService);

  // Determine if user is authenticated
  const token = await tokenService.getToken({ req: request });
  const isAuthenticated = !!token;

  // Log request completion
  logRequestCompletion(context, startTime, isAuthenticated);

  return { isAuthenticated, response: authResponse };
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
  // Process authentication
  const { response } = await processAuthentication(request, context, startTime, tokenService);

  // If auth processing returned a response, use it
  if (response) {
    return response;
  }

  // Set custom headers for tracking
  const nextResponse = NextResponse.next();
  nextResponse.headers.set('x-request-id', getRequestId());

  return nextResponse;
}

/**
 * Main middleware function with dependency injection
 */
export async function middleware(request: NextRequest) {
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
    reqLogger.error({ error, msg: 'Middleware error' });
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Apply middleware ONLY to the paths explicitly listed here.
    // Public paths are included to handle redirects (e.g., logged-in user visiting /login).
    // Protected paths are included to enforce authentication.
    ...publicPaths,
    ...protectedPaths,
  ],
};
