import type { NextAuthConfig, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt'; // Use this specific import for JWT type
import Google from 'next-auth/providers/google';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger'; // Use the logger from lib
import { UserRole } from '@/types';
// Import helpers, assuming they are Edge-compatible
import { handleJwtSignIn, handleJwtUpdate } from './auth-jwt-helpers';
// --- REMOVE Import for auth.routes ---
// import {
//   DEFAULT_LOGIN_REDIRECT,
//   PUBLIC_ROUTES,
//   AUTH_ROUTES,
//   API_AUTH_PREFIX,
// } from '@/lib/auth.routes';

// =============================================================================
// Constants (Define directly here)
// =============================================================================
const PUBLIC_ROUTES = ['/', '/about', '/api/health', '/api/log/client']; // Root, about, health, client logs
const AUTH_ROUTES = ['/login', '/register']; // Authentication process pages
const API_AUTH_PREFIX = '/api/auth'; // NextAuth.js internal API routes
const API_TEST_PREFIX = '/api/test'; // Test API routes
const DEFAULT_LOGIN_REDIRECT = '/'; // Redirect after successful login (if no callbackUrl)

// =============================================================================
// Environment Variable Check (Essential for JWT)
// =============================================================================
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    logger.warn(
      'CRITICAL: NEXTAUTH_SECRET not set, USING DANGEROUS DEFAULT (change this!) for DEV/TEST'
    );
    process.env.NEXTAUTH_SECRET =
      'replace-with-valid-secret-generated-using-auth-cli';
  } else {
    logger.error('FATAL ERROR: NEXTAUTH_SECRET environment variable is not set in PRODUCTION.');
    throw new Error('NEXTAUTH_SECRET environment variable is not set.');
  }
}

// =============================================================================
// Auth Config (Edge Compatible Parts)
// =============================================================================
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const correlationId = request.headers.get('X-Correlation-ID') || uuidv4();
      const clientIp =
        request.headers.get('x-forwarded-for') ??
        request.headers.get('remote-addr') ??
        'unknown';
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const logContext = { correlationId, clientIp, pathname, isLoggedIn, userId: auth?.user?.id };

      const v5CookieName = 'authjs.session-token';
      const sessionCookieValue = request.cookies.get(v5CookieName)?.value;
      logger.debug('[Auth Callback] Checking session cookie', {
        ...logContext,
        cookieNameChecked: v5CookieName,
        isCookiePresent: !!sessionCookieValue,
      });

      logger.debug('[Auth Callback] authorized check running', logContext);

      const isApiAuthRoute = pathname.startsWith(API_AUTH_PREFIX);
      const isApiTestRoute = pathname.startsWith(API_TEST_PREFIX);
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      const isAuthRoute = AUTH_ROUTES.includes(pathname);

      let decision = 'allowed (default)';
      let decisionResult = true;

      if (isApiAuthRoute || isApiTestRoute) {
        decision = 'allowed (API route)';
        decisionResult = true;
      } else if (isAuthRoute) {
        if (isLoggedIn) {
          decision = `redirected (logged in on auth route to ${DEFAULT_LOGIN_REDIRECT})`;
          decisionResult = false;
          logger.debug({ msg: '[Auth Callback] Decision', ...logContext, decision, redirectTo: DEFAULT_LOGIN_REDIRECT });
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        decision = 'allowed (not logged in on auth route)';
        decisionResult = true;
      } else if (!isLoggedIn && !isPublicRoute) {
        let callbackUrl = pathname;
        if (nextUrl.search) {
          callbackUrl += nextUrl.search;
        }
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('callbackUrl', encodeURIComponent(callbackUrl));
        decision = 'redirected (not logged in on protected route)';
        decisionResult = false;
        logger.debug({ msg: '[Auth Callback] Decision', ...logContext, decision, redirectTo: loginUrl.toString() });
        return Response.redirect(loginUrl);
      }

      logger.debug({ msg: '[Auth Callback] Decision', ...logContext, decision });
      return decisionResult;
    },

    async jwt({ token, user, account, profile, trigger }) {
      const correlationId = uuidv4();
      logger.debug({ msg: 'jwt callback triggered (config)', trigger, sub: token.sub, correlationId });

      if ((trigger === 'signIn' || trigger === 'signUp') && account && user) {
        return handleJwtSignIn({ token, user, account, profile, correlationId });
      }
      if (trigger === 'update') {
        return handleJwtUpdate(token, correlationId);
      }
      return token;
    },

    // Session callback runs server-side (Node.js) AFTER JWT callback usually
    // It receives the token from the JWT callback and can augment the session object
    // returned to the client.
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const correlationId = uuidv4();
      logger.debug({ msg: 'session callback triggered (config)', sub: token.sub, correlationId });

      // Only augment the session if the necessary token fields exist
      if (token.sub) {
        // Ensure session.user exists and initialize if necessary
        // Provide default values required by the Session['user'] type
        if (!session.user) {
          session.user = {
            id: '', // Initialize required fields
            role: UserRole.USER, // Provide a default role or handle appropriately
            // Initialize other required fields from your Session['user'] type if needed
            name: null,
            email: null,
            image: null,
          };
        }

        // Now assign properties from the token
        session.user.id = token.sub;
        if (token.role) session.user.role = token.role as UserRole;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;

        logger.info({
          msg: 'Session object populated from JWT (config)',
          userId: session.user.id,
          role: session.user.role,
          correlationId,
        });
      } else {
        // Log if token is missing essential data
        logger.warn({
          msg: 'Session callback could not populate session.user, token missing sub',
          tokenSub: !!token.sub,
          correlationId,
        });
      }

      return session; // Return the potentially augmented session
    },
  },
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig; 