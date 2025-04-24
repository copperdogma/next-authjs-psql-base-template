// lib/auth-edge.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig, DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { UserRole } from '.prisma/client';

// Extend session to include user ID and role (MUST MATCH auth-node.ts)
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  // We might not need the User interface extension here if only modifying session
  // interface User {
  //   role: UserRole;
  // }
}

// Define the log context type
interface LogContext {
  correlationId: string;
  clientIp: string;
  pathname: string;
  isLoggedIn: boolean;
  userId?: string;
  [key: string]: unknown;
}

// =============================================================================
// Constants for Edge Runtime
// =============================================================================
const PUBLIC_ROUTES = ['/', '/about', '/api/health', '/api/log/client'];
const AUTH_ROUTES = ['/login', '/register'];
const API_AUTH_PREFIX = '/api/auth';
const API_TEST_PREFIX = '/api/test'; // Keep test API prefix allowed if needed by other flows
const DEFAULT_LOGIN_REDIRECT = '/dashboard';  // Changed to dashboard from '/'

// =============================================================================
// Environment Variable Check for Edge Runtime
// =============================================================================
// Note: Secret check might be needed here too if middleware runs independently
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    logger.warn(
      '[Auth Edge] CRITICAL: NEXTAUTH_SECRET not set, USING DANGEROUS DEFAULT for DEV/TEST'
    );
    // Set a default only for non-production, avoid throwing here if possible
    process.env.NEXTAUTH_SECRET = 'edge-default-secret-needs-replacement';
  } else {
    // In production, we might want to log an error but let it proceed,
    // relying on the main Node config to throw if needed, or handle based on policy.
    logger.error('[Auth Edge] FATAL ERROR: NEXTAUTH_SECRET environment variable is not set in PRODUCTION.');
    // Consider whether middleware should fail open or closed if secret is missing
    // throw new Error('NEXTAUTH_SECRET environment variable is not set.');
  }
}

// =============================================================================
// Edge-Compatible Auth Configuration
// =============================================================================
export const authConfigEdge: NextAuthConfig = {
  // Include only providers compatible with the Edge runtime
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // --- authorized callback (Edge-specific logic) ---
    async authorized({ auth, request }) {
      const { nextUrl } = request;

      // First try auth from middleware
      const isLoggedIn = !!auth; // Check if auth exists at all

      // Log what we have in auth
      logger.debug({
        msg: '[Auth Edge] authorized callback data',
        hasAuth: !!auth,
        hasUser: !!auth?.user,
        userId: auth?.user?.id || (auth?.user as { sub?: string })?.sub,
        path: nextUrl.pathname
      });

      // Extract user ID for logging
      let userId;
      if (auth?.user && auth.user.id) {
        userId = auth.user.id;
      } else if (auth?.user && 'sub' in auth.user) {
        userId = (auth.user as { sub: string }).sub;
      }

      const pathname = nextUrl.pathname;

      // Create log context
      const logContext = createLogContext(request, isLoggedIn, userId);

      logger.debug('[Auth Edge Callback] authorized check running', logContext);

      // Handle special routes first (APIs, public routes, auth routes)
      // Check if the route is public or an API route
      if (
        PUBLIC_ROUTES.includes(pathname) ||
        pathname.startsWith(API_AUTH_PREFIX) ||
        pathname.startsWith(API_TEST_PREFIX)
      ) {
        logger.debug('[Auth Edge] Allowing public or API route', { pathname });
        return true;
      }

      // Handle login route - redirect authenticated users to dashboard
      if (AUTH_ROUTES.includes(pathname)) {
        if (isLoggedIn) {
          logger.debug('[Auth Edge] Redirecting authenticated user from auth route to dashboard');
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl.origin));
        }
        return true;
      }

      // Handle protected routes - if not logged in, return false to trigger redirect
      if (!isLoggedIn) {
        // Use the logContext directly and add the specific message
        logger.info({
          ...logContext, // Spread context first (contains pathname, userId etc.)
          msg: '[Auth Edge Callback] Unauthorized access to protected route, redirecting...', // Add specific message
        });

        // Explicitly return redirect instead of false for testing
        // return false; 
        return Response.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl.origin));
      }

      // User is authenticated and trying to access a protected route
      logger.debug({
        msg: '[Auth Edge] Allowing authenticated access to protected route',
        // userId,
        // pathname
        ...logContext // Use context here too for consistency
      });

      return true;
    },

    // --- ADDED session callback (Mirroring auth-node.ts logic) ---
    async session({ session, token }) {
      // Use simplified logging for Edge
      logger.debug({ msg: '[Auth Edge] Start session callback', hasTokenSub: !!token?.sub });
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.role) {
        // Ensure role is treated as the UserRole type
        session.user.role = token.role as UserRole;
      }
      // Add other fields if needed, ensure they exist on token
      if (token?.name) {
        session.user.name = token.name;
      }
      if (token?.email) {
        session.user.email = token.email;
      }
      // Potentially add image if present on token
      if (token?.picture) {
        session.user.image = token.picture;
      }

      logger.debug({
        msg: '[Auth Edge] End session callback',
        userId: session.user.id,
        userRole: session.user.role
      });
      return session;
    },

    // --- ADDED jwt callback (Mirroring auth-node.ts logic, simplified) ---
    // Note: This primarily runs on sign-in/token creation via the Node.js handler,
    // but having it here might be necessary if the Edge runtime ever needs to
    // refresh or handle the JWT directly.
    async jwt({ token, user, trigger, session }) {
      logger.debug({ msg: '[Auth Edge] Start jwt callback', hasUser: !!user, trigger });
      if (user) { // Populating token on initial sign-in
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        logger.debug({ msg: '[Auth Edge] jwt callback: Populated token from user object', sub: token.sub });
      }

      // Handle session update trigger from client
      if (trigger === 'update' && session) {
        logger.debug({ msg: '[Auth Edge] jwt callback: Update trigger', session });
        // You can update the token based on `session` data here if needed
        if (session.user?.name) token.name = session.user.name;
        // Add other fields as necessary
      }

      logger.debug({ msg: '[Auth Edge] End jwt callback' });
      return token;
    }
  },
  // Debug flag can be useful
  debug: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  // Pages might be needed if redirects happen from middleware
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};

// =============================================================================
// Helper Functions for Auth Logic
// =============================================================================

// Create log context from request
function createLogContext(request: Request, isLoggedIn: boolean, userId?: string): LogContext {
  return {
    correlationId: request.headers.get('X-Correlation-ID') || uuidv4(),
    clientIp: request.headers.get('x-forwarded-for') ??
      request.headers.get('remote-addr') ??
      'unknown',
    pathname: new URL(request.url).pathname,
    isLoggedIn,
    userId
  };
}

// =============================================================================
// Initialization and Exports (Edge-specific)
// =============================================================================

logger.info('[Auth Edge Config] Initializing Edge-compatible NextAuth.');

// Initialize NextAuth with the edge config and export only the 'auth' handler for middleware
export const { auth } = NextAuth(authConfigEdge);

logger.info('[Auth Edge Config] Edge-compatible NextAuth initialization complete.'); 