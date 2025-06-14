// lib/auth-edge.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
// import Google from 'next-auth/providers/google'; // Provided by shared config
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
// import { UserRole } from '@/types'; // Unused import removed
import { sharedAuthConfig, handleSharedSessionCallback, SESSION_MAX_AGE } from './auth-shared'; // Import shared config, callback, and SESSION_MAX_AGE
import { logRequestResponse } from '@/middleware/request-logger'; // Corrected import path
import { type NextRequest, NextResponse } from 'next/server';
import { ROUTES, PUBLIC_ROUTES, AUTH_ROUTES, API_PREFIXES } from '@/lib/constants/routes';

// Define a unique symbol for storing the NextAuth instance globally
const NEXTAUTH_INSTANCE = Symbol.for('nextAuthInstanceEdge');
const NEXTAUTH_LOCK = Symbol.for('nextAuthLockEdge');
const NEXTAUTH_INITIALIZED = Symbol.for('nextAuthInitializedEdge');

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
  [NEXTAUTH_LOCK]?: boolean;
  [NEXTAUTH_INITIALIZED]?: boolean;
};

/**
 * Initializes and/or retrieves the NextAuth instance for the Edge runtime.
 * Ensures that NextAuth is initialized only once using a lock-based singleton pattern.
 */
function getNextAuthInstance(): NextAuthInstance {
  const globalWithNextAuth = globalThis as GlobalWithNextAuth;

  if (globalWithNextAuth[NEXTAUTH_INSTANCE]) {
    return globalWithNextAuth[NEXTAUTH_INSTANCE] as NextAuthInstance;
  }

  if (globalWithNextAuth[NEXTAUTH_LOCK]) {
    while (globalWithNextAuth[NEXTAUTH_LOCK]); // Busy wait for lock release

    if (globalWithNextAuth[NEXTAUTH_INSTANCE]) {
      return globalWithNextAuth[NEXTAUTH_INSTANCE] as NextAuthInstance;
    }
  }

  globalWithNextAuth[NEXTAUTH_LOCK] = true;

  try {
    // Double-check after acquiring lock
    if (!globalWithNextAuth[NEXTAUTH_INSTANCE]) {
      const instance = NextAuth(authConfigEdge);
      globalWithNextAuth[NEXTAUTH_INSTANCE] = instance;
      logger.info(
        '[Auth Edge Config] Edge-compatible NextAuth initialization COMPLETE (Singleton).'
      );
    }
  } finally {
    globalWithNextAuth[NEXTAUTH_LOCK] = false;
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
const DEFAULT_LOGIN_REDIRECT = ROUTES.DASHBOARD;

// --- Route Type Checkers (Keep specific to Edge) ---
const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]);
const isApiRoute = (pathname: string): boolean =>
  pathname.startsWith(API_PREFIXES.AUTH) || pathname.startsWith(API_PREFIXES.TEST);
const isAuthRoute = (pathname: string): boolean =>
  AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number]);

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
        maxAge: SESSION_MAX_AGE, // Use the shared constant for consistency
      },
    },
    // CSRF token might have different requirements or defaults in Edge vs Node?
    // If same as shared (none) or requires specific Edge config, adjust here.
    // csrfToken: { ... } // Example if needed
  },
  session: {
    ...sharedAuthConfig.session, // Inherits JWT strategy and other shared session settings
    strategy: 'jwt' as const, // Ensure JWT strategy is explicit for Edge
    maxAge: SESSION_MAX_AGE, // Use the shared constant for consistency
    // updateAge behavior might differ or be irrelevant in Edge middleware context?
  },

  // Define Edge-specific callbacks
  callbacks: {
    // Inherit shared session callback
    ...sharedAuthConfig.callbacks,

    // --- authorized callback (Edge-specific logic) ---

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

      // Check if authenticated user is on root path and redirect to dashboard
      if (isLoggedIn && pathname === '/') {
        logger.debug(
          '[Auth Edge] Authenticated user on root, redirecting to dashboard',
          logContext
        );
        response = Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl.origin));
      } else if (isPublicRoute(pathname) || isApiRoute(pathname) || isIcon) {
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
        token.id = user.id ?? '';
        token.role = user.role; // Assumes User type from shared config has role
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        logger.debug({
          msg: '[Auth Edge] jwt callback: Populated token from user object',
          id: token.id,
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

// Create a self-executing function to initialize NextAuth only once
const initNextAuth = () => {
  const globalWithNextAuth = globalThis as GlobalWithNextAuth;

  // Check if we've already initialized
  if (globalWithNextAuth[NEXTAUTH_INITIALIZED]) {
    logger.debug('[Auth Edge Config] NextAuth already initialized at module level');
    return getNextAuthInstance();
  }

  logger.info('[Auth Edge Config] Initializing NextAuth at module level (singleton)');

  // Mark as initialized
  globalWithNextAuth[NEXTAUTH_INITIALIZED] = true;

  // Return the instance
  return getNextAuthInstance();
};

// Retrieve and export the NextAuth instance (will be initialized only once)
const { handlers, auth, signIn, signOut } = initNextAuth();
export { handlers, auth, signIn, signOut };
