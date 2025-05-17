// lib/auth-edge.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
// import Google from 'next-auth/providers/google'; // Provided by shared config
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
// import { UserRole } from '@/types'; // Unused import removed
import { sharedAuthConfig, handleSharedSessionCallback } from './auth-shared'; // Import shared config and callback
import { logRequestResponse } from '@/middleware/request-logger'; // Corrected import path
import { type NextRequest, NextResponse } from 'next/server';

// Define a unique symbol for storing the NextAuth instance globally
const NEXTAUTH_INSTANCE = Symbol.for('nextAuthInstanceEdge');

interface NextAuthInstance {
  handlers: {
    GET: (req: NextRequest) => Promise<Response>;
    POST: (req: NextRequest) => Promise<Response>;
  };
  auth: () => Promise<Session | null>;
  signIn: (provider?: string, options?: Record<string, unknown>) => Promise<unknown>;
  signOut: (options?: Record<string, unknown>) => Promise<unknown>;
}

// Type for the global object containing NextAuthInstance
type GlobalWithNextAuth = typeof globalThis & {
  [NEXTAUTH_INSTANCE]?: NextAuthInstance;
};

/**
 * Initializes and/or retrieves the NextAuth instance for the Edge runtime.
 * Ensures that NextAuth is initialized only once.
 */
function getNextAuthInstance(): NextAuthInstance {
  // Check if the instance already exists on the global object
  const globalWithNextAuth = globalThis as GlobalWithNextAuth;

  if (!globalWithNextAuth[NEXTAUTH_INSTANCE]) {
    logger.info('[Auth Edge Config] Initializing Edge-compatible NextAuth (Singleton)...');
    const instance = NextAuth(authConfigEdge);
    globalWithNextAuth[NEXTAUTH_INSTANCE] = instance;
    logger.info('[Auth Edge Config] Edge-compatible NextAuth initialization complete (Singleton).');
  } else {
    logger.debug(
      '[Auth Edge Config] Reusing existing Edge-compatible NextAuth instance (Singleton).'
    );
  }
  return globalWithNextAuth[NEXTAUTH_INSTANCE] as NextAuthInstance;
}

// Extend session types (already done in auth-shared.ts, no need to repeat declare module)

// Define the log context type (keep specific to edge helpers)
interface LogContext {
  correlationId: string;
  clientIp: string;
  pathname: string;
  isLoggedIn: boolean;
  userId?: string;
  [key: string]: unknown;
}

// =============================================================================
// Constants for Edge Runtime (Keep specific to Edge)
// =============================================================================
const PUBLIC_ROUTES = [
  '/', // Allow access to the home page when logged out
  '/about',
  '/api/health',
  '/api/log/client',
  '/manifest.webmanifest', // Explicitly allow manifest
];
const AUTH_ROUTES = ['/login', '/register'];
const API_AUTH_PREFIX = '/api/auth';
const API_TEST_PREFIX = '/api/test';
const DEFAULT_LOGIN_REDIRECT = '/dashboard';

// --- Route Type Checkers (Keep specific to Edge) ---
const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.includes(pathname);
const isApiRoute = (pathname: string): boolean =>
  pathname.startsWith(API_AUTH_PREFIX) || pathname.startsWith(API_TEST_PREFIX);
const isAuthRoute = (pathname: string): boolean => AUTH_ROUTES.includes(pathname);

// =============================================================================
// Environment Variable Check for Edge Runtime (Keep specific to Edge)
// =============================================================================
if (!process.env.NEXTAUTH_SECRET) {
  // Use sharedAuthConfig.secret or handle error/default as before
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    logger.warn(
      '[Auth Edge] CRITICAL: NEXTAUTH_SECRET not set, USING DANGEROUS DEFAULT for DEV/TEST'
    );
    process.env.NEXTAUTH_SECRET = 'edge-default-secret-needs-replacement'; // Default for dev/test ONLY
  } else {
    const errorMessage =
      '[Auth Edge] FATAL ERROR: NEXTAUTH_SECRET environment variable is not set in PRODUCTION.';
    logger.error({ err: new Error('NEXTAUTH_SECRET_NOT_SET_IN_PRODUCTION') }, errorMessage);
    // Potentially throw, depending on desired fail behavior
    throw new Error(
      'NEXTAUTH_SECRET is not set. Please set it in your .env file (or environment variables).'
    ); // Ensure test expectation
  }
}

// =============================================================================
// Edge Helper Functions (Keep specific to Edge)
// =============================================================================

// Helper function to handle logic for authentication routes
function handleAuthRoute(isLoggedIn: boolean, nextUrl: URL): Response | true {
  if (isLoggedIn) {
    logger.debug('[Auth Edge] Redirecting authenticated user from auth route');
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl.origin));
  }
  logger.debug('[Auth Edge] Allowing unauthenticated access to auth route');
  return true;
}

// Helper function to handle logic for protected routes
function handleProtectedRoute(
  isLoggedIn: boolean,
  pathname: string,
  nextUrl: URL,
  logContext: LogContext
): Response | true {
  if (!isLoggedIn) {
    logger.info({
      ...logContext,
      msg: '[Auth Edge Callback] Unauthorized access to protected route, redirecting...',
    });
    return Response.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl.origin)
    );
  }
  logger.debug({
    ...logContext,
    msg: '[Auth Edge] Allowing authenticated access to protected route',
  });
  return true;
}

// Create log context from request
function createLogContext(request: Request, isLoggedIn: boolean, userId?: string): LogContext {
  return {
    correlationId: request.headers.get('X-Correlation-ID') || uuidv4(),
    clientIp:
      request.headers.get('x-forwarded-for') ?? request.headers.get('remote-addr') ?? 'unknown',
    pathname: new URL(request.url).pathname,
    isLoggedIn,
    userId,
  };
}

// =============================================================================
// Edge-Compatible Auth Configuration
// =============================================================================

export const authConfigEdge: NextAuthConfig = {
  // Spread shared config
  ...sharedAuthConfig,

  // Edge does NOT use Prisma adapter
  adapter: undefined, // Explicitly undefined

  // Providers are inherited from sharedAuthConfig, provide fallback
  providers: sharedAuthConfig.providers ?? [],

  // Override/set Edge-specific cookie/session settings if necessary
  cookies: {
    ...sharedAuthConfig.cookies, // Base settings
    sessionToken: {
      ...(sharedAuthConfig.cookies?.sessionToken || {}),
      options: {
        ...(sharedAuthConfig.cookies?.sessionToken?.options || {}),
        maxAge: 30 * 24 * 60 * 60, // 30 days session timeout for Edge (align with Node?)
      },
    },
    // CSRF token might have different requirements or defaults in Edge vs Node?
    // If same as shared (none) or requires specific Edge config, adjust here.
    // csrfToken: { ... } // Example if needed
  },
  session: {
    ...sharedAuthConfig.session, // Inherits JWT strategy and other shared session settings
    strategy: 'jwt' as const, // Ensure JWT strategy is explicit for Edge
    maxAge: 30 * 24 * 60 * 60, // 30 days session timeout (align with Node?)
    // updateAge behavior might differ or be irrelevant in Edge middleware context?
  },

  // Define Edge-specific callbacks
  callbacks: {
    // Inherit shared session callback
    ...sharedAuthConfig.callbacks,

    // --- authorized callback (Edge-specific logic) ---
    // eslint-disable-next-line complexity, max-lines-per-function, max-statements
    async authorized({ auth, request }) {
      const { nextUrl } = request;
      const pathname = nextUrl.pathname;
      const isLoggedIn = !!auth;
      const userId = auth?.user?.id;
      const logContext = createLogContext(request, isLoggedIn, userId);
      const startTime = Date.now();

      logger.debug('[Auth Edge Callback] authorized check running', logContext);

      const isIcon = pathname.startsWith('/icon-');

      // Decision variable
      let allowAccess = false;
      let response: Response | undefined = undefined;

      if (isPublicRoute(pathname) || isApiRoute(pathname) || isIcon) {
        logger.debug('[Auth Edge] Allowing public, API, or icon route', {
          ...logContext,
          pathname,
        });
        allowAccess = true;
        // For allowed routes without explicit response, log with a generic 200
        logRequestResponse(
          request as NextRequest,
          new Response(null, { status: 200 }) as NextResponse,
          startTime
        );
      } else if (isAuthRoute(pathname)) {
        const authRouteDecision = handleAuthRoute(isLoggedIn, nextUrl);
        if (typeof authRouteDecision === 'boolean') {
          allowAccess = authRouteDecision;
        } else {
          response = authRouteDecision;
        }
        // Log the actual response if one is generated
        logRequestResponse(
          request as NextRequest,
          response ?? (new Response(null, { status: allowAccess ? 200 : 401 }) as NextResponse),
          startTime
        );
      } else {
        // Protected route
        const protectedRouteDecision = handleProtectedRoute(
          isLoggedIn,
          pathname,
          nextUrl,
          logContext
        );
        if (typeof protectedRouteDecision === 'boolean') {
          allowAccess = protectedRouteDecision;
        } else {
          response = protectedRouteDecision;
        }
        // Log the actual response if one is generated
        logRequestResponse(
          request as NextRequest,
          response ?? (new Response(null, { status: allowAccess ? 200 : 401 }) as NextResponse),
          startTime
        );
      }

      return response ?? allowAccess; // Return Response object or boolean
    },

    // --- jwt callback (Edge-specific, potentially simplified) ---
    // This might be needed if the Edge runtime needs to interact with the JWT,
    // e.g., for token validation or light enrichment. It likely won't
    // perform DB lookups like the Node version.
    async jwt({ token, user, trigger, session }) {
      logger.debug({ msg: '[Auth Edge] Start jwt callback', hasUser: !!user, trigger });

      // If user object exists (e.g., during initial sign-in via Edge? Unlikely but possible)
      if (user) {
        // Populate basic info if available from user obj
        token.sub = user.id;
        token.role = user.role; // Assumes User type from shared config has role
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        logger.debug({
          msg: '[Auth Edge] jwt callback: Populated token from user object',
          sub: token.sub,
        });
      }

      // Handle session update trigger? Less common in Edge middleware
      if (trigger === 'update' && session) {
        logger.debug({ msg: '[Auth Edge] jwt callback: Update trigger', session });
        // Update token based on session data if needed (e.g., name)
        if (session.user?.name) token.name = session.user.name;
      }

      logger.debug({ msg: '[Auth Edge] End jwt callback' });
      return token;
    },

    // --- session callback (Edge-specific) ---
    async session(params: {
      session: Session;
      token: JWT;
      // user: any; // Not used by handleSharedSessionCallback
      // newSession?: any; // Not used by handleSharedSessionCallback
      // trigger?: 'update'; // Not used by handleSharedSessionCallback directly
    }) {
      // handleSharedSessionCallback only expects session and token
      return handleSharedSessionCallback({ session: params.session, token: params.token });
    },
  },
  // Pages are inherited from sharedAuthConfig
  // Debug is inherited from sharedAuthConfig
  // Secret is inherited from sharedAuthConfig
};

// Retrieve and export the NextAuth instance
const { handlers, auth, signIn, signOut } = getNextAuthInstance();
export { handlers, auth, signIn, signOut };
