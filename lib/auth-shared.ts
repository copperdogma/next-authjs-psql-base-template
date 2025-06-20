import type { DefaultSession, NextAuthConfig, Session } from 'next-auth';
import type { JWT } from '@auth/core/jwt';
import Google from 'next-auth/providers/google';
import { UserRole } from '@/types';
import { logger } from './logger';
// import { PrismaClient } from '@prisma/client'; // Commented out as likely unused here

// const db = new PrismaClient(); // REMOVED unused variable assignment

// ====================================
// Shared Type Extensions
// ====================================
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  // Augment the default User type as well if needed globally
  interface User {
    role: UserRole;
  }
}

// ====================================
// Shared Configuration Values
// ====================================

// Define a constant for the session lifetime in seconds
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Shared Cookie Settings (Base)
const sharedCookieConfig = {
  sessionToken: {
    name:
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const, // Use const assertion for literal type
      path: '/',
      maxAge: SESSION_MAX_AGE, // Explicitly set to 30 days
    },
  },
  // Note: CSRF token cookie might differ slightly (e.g., __Host prefix)
  // It might be better to define it fully in node/edge configs if significantly different
};

// Shared Session Settings
const sharedSessionConfig = {
  strategy: 'jwt' as const, // Use const assertion
  maxAge: SESSION_MAX_AGE, // Explicitly set to 30 days
};

// Define the shared session callback function separately
// EXPORT the function so it can be tested directly
export async function handleSharedSessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}) {
  logger.debug({
    msg: '[Shared Session Callback] Start',
    hasTokenSub: !!token?.sub,
  });

  // Ensure session.user exists before trying to assign to its properties
  if (!session.user) {
    session.user = {} as Session['user']; // Initialize if null or undefined
  }

  if (token) {
    if (token.id) session.user.id = token.id;
    if (token.role) session.user.role = token.role as UserRole;
    if (token.name) session.user.name = token.name;
    if (token.email) session.user.email = token.email;
    if (token.picture) session.user.image = token.picture;
  }

  logger.debug({
    msg: '[Shared Session Callback] End',
    userId: session.user.id,
    userRole: session.user.role,
  });
  return session;
}

// ====================================
// Base Auth Config Object
// ====================================

export const sharedAuthConfig: Partial<NextAuthConfig> = {
  // Providers common to both runtimes
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Defaulting to false for enhanced security.
      // Set to true only if you understand the implications and have a specific need
      // for users to automatically link OAuth accounts to existing email accounts
      // with the same email address without explicit prior sign-in.
      // See NextAuth.js docs on account linking for more details.
      allowDangerousEmailAccountLinking: false,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // Shared cookie settings (partial)
  cookies: {
    sessionToken: sharedCookieConfig.sessionToken,
    // Define csrfToken specifically in node/edge configs if needed
  },
  // Shared session strategy
  session: {
    ...sharedSessionConfig,
    // maxAge is now explicitly defined in sharedSessionConfig
  },
  // Shared callbacks
  callbacks: {
    session: handleSharedSessionCallback,
    // Define jwt and authorized callbacks specifically in node/edge configs
  },
  // Shared pages configuration
  pages: {
    signIn: '/login',
    error: '/auth/error', // Default error page
  },
  // Shared secret (needed in both contexts)
  secret: process.env.NEXTAUTH_SECRET,
  // Debug can be shared, default to false
  debug: false,
};
