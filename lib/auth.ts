// =============================================================================
// Unit Testing Note:
// Unit testing authentication configurations, especially involving NextAuth.js and
// potentially dependency injection patterns, can be complex. Mocking NextAuth
// internals, session handling, and providers within a Jest environment is often
// challenging. Unit tests for this configuration were skipped due to these
// difficulties.
//
// Validation Strategy:
// The overall authentication flow, including configuration aspects, is primarily
// validated through End-to-End (E2E) tests that simulate real user login and
// session management scenarios.
// =============================================================================

// Import specific types needed from adapters and core, aliasing if necessary
import { type Adapter, type AdapterUser } from 'next-auth/adapters';
import { type JWT } from '@auth/core/jwt';
// DO NOT import Session or User from @auth/core/types to avoid conflicts
// import { type Session as CoreSession, type User as CoreUser } from '@auth/core/types';

// Main NextAuth imports - These SHOULD contain augmented types via next-auth.d.ts
import NextAuth, {
  type NextAuthConfig,
  type Account,
  type Profile,
  type User as NextAuthUser, // Rename to avoid conflict
  type Session, // Use this Session type, should be augmented
} from 'next-auth';

// Other necessary imports
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types'; // Use this UserRole enum consistently
// import { type User as PrismaUser } from '@prisma/client'; // Unused import
// Import helpers from the new file
import { validateSignInInputs, handleJwtSignIn, handleJwtUpdate } from './auth-jwt-helpers';

const HARDCODED_TEST_SECRET = 'test-secret-for-next-auth-test-environment';

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  if (
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    HARDCODED_TEST_SECRET
  ) {
    logger.warn('USING HARDCODED NEXTAUTH_SECRET FOR TEST/DEV');
    process.env.NEXTAUTH_SECRET = HARDCODED_TEST_SECRET;
  } else {
    logger.error('FATAL ERROR: NEXTAUTH_SECRET environment variable is not set.');
    throw new Error('NEXTAUTH_SECRET environment variable is not set.');
  }
}

const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
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
  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser | AdapterUser;
      account: Account | null;
      profile?: Profile;
    }): Promise<boolean | string> {
      const correlationId = uuidv4();
      logger.debug({
        msg: 'signIn callback triggered',
        provider: account?.provider,
        correlationId,
      });

      const validation = validateSignInInputs(user, account, correlationId);
      if (!validation.isValid || !validation.userEmail) {
        return false;
      }

      if (!account || !user) {
        logger.error({ msg: 'Missing account or user object after validation', correlationId });
        return false;
      }

      logger.info({
        msg: 'Sign-in allowed',
        userId: user.id,
        email: validation.userEmail,
        provider: account.provider,
        correlationId,
      });
      return true;
    },

    async jwt({
      token,
      user,
      account,
      profile,
      trigger,
    }: {
      token: JWT;
      user?: NextAuthUser | AdapterUser;
      account?: Account | null;
      profile?: Profile;
      trigger?: 'signIn' | 'update' | 'signUp';
    }): Promise<JWT> {
      const correlationId = uuidv4();
      logger.debug({ msg: 'jwt callback triggered', trigger, sub: token.sub, correlationId });

      if ((trigger === 'signIn' || trigger === 'signUp') && account && user) {
        return handleJwtSignIn({ token, user, account, profile, correlationId });
      }
      if (trigger === 'update') {
        return handleJwtUpdate(token, correlationId);
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const correlationId = uuidv4();
      logger.debug({ msg: 'session callback triggered', sub: token.sub, correlationId });

      if (token.sub && token.role && token.email && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        logger.info({
          msg: 'Session object populated from JWT',
          userId: session.user.id,
          role: session.user.role,
          correlationId,
        });
      } else {
        logger.warn({
          msg: 'Session callback skipped, token missing required claims (sub, role, email) or session.user missing',
          tokenSub: !!token.sub,
          tokenRole: !!token.role,
          tokenEmail: !!token.email,
          sessionUserExists: !!session.user,
          correlationId,
        });
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn(message) {
      logger.info({
        event: 'signIn',
        userId: message.user.id,
        provider: message.account?.provider,
      });
    },
    async signOut(message) {
      if ('session' in message && message.session) {
        logger.info({ event: 'signOut', sessionId: message.session.sessionToken });
      } else if ('token' in message && message.token) {
        logger.info({ event: 'signOut', userId: message.token.sub });
      } else {
        logger.info({ event: 'signOut', reason: 'Session/Token details not available in message' });
      }
    },
    async createUser(message) {
      logger.info({ event: 'createUser', userId: message.user.id });
    },
    async linkAccount(message) {
      logger.info({
        event: 'linkAccount',
        userId: message.user.id,
        provider: message.account?.provider,
      });
    },
  },
};

// Export handlers and auth function using the configured options
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Re-export UserRole for convenience
export { UserRole };
// Export authOptions if needed for testing
export { authOptions };
