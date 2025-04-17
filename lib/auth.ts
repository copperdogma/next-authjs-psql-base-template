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
import type { NextAuthConfig, Session, User, Account, Profile } from 'next-auth';
import type { AdapterSession, AdapterUser } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import Google from 'next-auth/providers/google';
import { prisma } from './prisma';
import type { LoggerService } from '@/lib/interfaces/services';
import { createContextLogger } from '@/lib/services/logger-service';
import { createCorrelationId } from './auth-logging';
import { UserRole } from '@/types';
import NextAuth from 'next-auth'; // Import NextAuth function itself

// Define a type alias for the User object expected by callbacks/authorize, extending Auth.js User
type AuthUser = User & { role?: UserRole };

// Instantiate logger
const logger: LoggerService = createContextLogger('auth');

// Type for the arguments object for findOrCreateUserAndAccount
interface FindOrCreateUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  providerAccountId: string;
  provider: string;
  correlationId: string;
}

// Type for the arguments object for handleJwtSignIn
interface HandleJwtSignInParams {
  token: JWT;
  user: User | AdapterUser;
  account: Account;
  profile: Profile;
  correlationId: string;
}

// Helper to find or create an account link for an existing user
async function findOrCreateAccountLink(
  userId: string,
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<void> {
  logger.debug({ msg: 'Checking account link', userId, provider, correlationId });
  const accountLink = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });
  if (!accountLink) {
    logger.info({
      msg: 'Creating new account link for existing user',
      userId,
      provider,
      correlationId,
    });
    await prisma.account.create({
      data: {
        userId,
        provider,
        providerAccountId,
        type: 'oauth',
      },
    });
  }
}

// Refactored Helper function to find or create a user and link their account
async function findOrCreateUserAndAccount(
  params: FindOrCreateUserParams
): Promise<AuthUser | null> {
  const { email, profileData, providerAccountId, provider, correlationId } = params;
  try {
    let dbUser = await prisma.user.findUnique({ where: { email } });

    if (!dbUser) {
      logger.info({ msg: 'Creating new user', email, provider, correlationId });
      dbUser = await prisma.user.create({
        data: {
          id: profileData.id,
          email: email,
          name: profileData.name,
          image: profileData.image,
          role: 'USER',
        },
      });
      // Directly create account link for new user
      await prisma.account.create({
        data: { userId: dbUser.id, provider, providerAccountId, type: 'oauth' },
      });
      logger.info({ msg: 'New user and account created', userId: dbUser.id, correlationId });
    } else {
      // User exists, use helper to ensure account link exists
      await findOrCreateAccountLink(dbUser.id, provider, providerAccountId, correlationId);
    }
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role as UserRole,
    };
  } catch (error) {
    logger.error({
      msg: 'Error in findOrCreateUserAndAccount',
      email,
      provider,
      error:
        error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      correlationId,
    });
    return null;
  }
}

// Helper to validate signIn inputs and extract key info
// eslint-disable-next-line complexity
function validateSignInInputs(
  user: User | AdapterUser | null | undefined,
  account: Account | null | undefined,
  profile: Profile | null | undefined,
  correlationId: string
): { isValid: boolean; userId?: string; userEmail?: string } {
  if (!user?.id || !account?.provider || !account?.providerAccountId || !profile) {
    logger.error({ msg: 'signIn trigger missing required data', correlationId });
    return { isValid: false };
  }
  const userId = profile.sub ?? user.id;
  const userEmail = profile.email ?? user.email;
  if (!userEmail || !userId) {
    logger.error({ msg: 'Missing email or ID during sign-in', userId, userEmail, correlationId });
    return { isValid: false };
  }
  return { isValid: true, userId, userEmail };
}

// Helper to build the final JWT
function buildNewJwt(token: JWT, dbUser: AuthUser): JWT {
  return {
    ...token,
    sub: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.image,
  };
}

// Refactored Helper function for JWT signIn trigger
async function handleJwtSignIn(params: HandleJwtSignInParams): Promise<JWT> {
  const { token, user, account, profile, correlationId } = params;

  const validation = validateSignInInputs(user, account, profile, correlationId);
  if (!validation.isValid || !validation.userId || !validation.userEmail) {
    return {}; // Return empty token if validation fails
  }

  // Re-check account for type safety before accessing properties
  if (!account) {
    logger.error({ msg: 'Account object unexpectedly missing after validation', correlationId });
    return {};
  }

  const { userId, userEmail } = validation;

  logger.info({
    msg: 'Initial sign-in detected',
    userId,
    provider: account.provider,
    correlationId,
  }); // Use checked account

  // Re-check profile and user for type safety before accessing properties
  if (!profile || !user) {
    logger.error({
      msg: 'Profile or User object unexpectedly missing after validation',
      correlationId,
    });
    return {};
  }

  // Prepare data and find/create user
  const profileDataForDb = {
    id: userId,
    email: userEmail,
    name: profile.name ?? user.name,
    image: profile.picture ?? user.image,
  }; // Use checked profile/user
  const dbUser = await findOrCreateUserAndAccount({
    email: userEmail,
    profileData: profileDataForDb,
    providerAccountId: account.providerAccountId, // Use checked account
    provider: account.provider, // Use checked account
    correlationId,
  });

  // Handle failure to find/create user
  if (!dbUser) {
    logger.error({
      msg: 'Failed find/create user during sign-in',
      email: userEmail,
      correlationId,
    });
    return {}; // Return empty token on error
  }

  // Successfully found/created user, update token
  const newToken = buildNewJwt(token, dbUser);
  logger.info({
    msg: 'Token updated after sign-in',
    userId: newToken.sub,
    role: newToken.role,
    correlationId,
  });
  return newToken;
}

// --- Helper function for JWT update trigger ---
async function handleJwtUpdate(token: JWT, correlationId: string): Promise<JWT> {
  logger.info({ msg: 'Session update trigger detected', userId: token.sub, correlationId });
  if (!token.sub) {
    logger.warn({ msg: 'Update trigger received but no token.sub found', correlationId });
    return token; // Return original token
  }

  const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
  if (dbUser) {
    const updatedToken: JWT = {
      ...token,
      role: dbUser.role as UserRole,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.image,
    };
    logger.info({
      msg: 'Token updated from DB on update trigger',
      userId: updatedToken.sub,
      role: updatedToken.role,
      correlationId,
    });
    return updatedToken;
  } else {
    logger.warn({
      msg: 'User not found in DB during token update',
      userId: token.sub,
      correlationId,
    });
    return token; // Return original token if user not found
  }
}

export const authConfig: NextAuthConfig = {
  // adapter: PrismaAdapter(prisma) as Adapter, // Keep adapter commented out
  session: {
    // Use JWT strategy
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Keep Credentials commented out
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      const correlationId = createCorrelationId('jwtCb');
      logger.debug({
        msg: 'JWT callback',
        trigger,
        hasUser: !!user,
        hasAccount: !!account,
        correlationId,
      });

      // --- Main logic: Call appropriate helper based on trigger ---
      if (trigger === 'signIn' && user && account && profile) {
        // Pass the necessary arguments as a single object
        return await handleJwtSignIn({ token, user, account, profile, correlationId });
      } else if (trigger === 'update') {
        return await handleJwtUpdate(token, correlationId);
      }

      // Default: return the token unchanged for other triggers
      logger.debug({
        msg: 'JWT callback: unhandled trigger or no relevant data, returning token as is',
        trigger,
        correlationId,
      });
      return token;
    },

    // Restore session callback for JWT strategy
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const correlationId = createCorrelationId('sessionCb');
      logger.debug({
        msg: 'Session callback invoked (JWT strategy)',
        userId: token?.sub,
        correlationId,
      });
      // Assign properties from token to session.user
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        // Cast session.user to include the role property we expect
        const sessionUser = session.user as AuthUser;
        sessionUser.role = token.role as UserRole; // Assign role from token
        sessionUser.email = token.email as string; // Assign email from token
        sessionUser.name = token.name as string; // Assign name from token
        sessionUser.image = token.picture as string; // Assign image from token
        logger.debug({
          msg: 'Session populated from token',
          userId: session.user.id,
          role: sessionUser.role,
          correlationId,
        });
      } else {
        logger.warn({
          msg: 'Session callback invoked without token.sub or session.user',
          correlationId,
        });
      }
      return session;
    },
  },
  events: {
    // Keep events, adapter handles user/account creation now
    async signIn({ user, account, isNewUser }) {
      const correlationId = createCorrelationId('signInEvent');
      logger.info({
        msg: 'signIn event (JWT strategy)',
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser: isNewUser ?? 'unknown',
        correlationId,
      });
    },
    async signOut(
      message: { session: AdapterSession | null | undefined | void } | { token: JWT | null }
    ) {
      const correlationId = createCorrelationId('signOutEvent');
      let userId: string | undefined = undefined;
      let sessionIdentifier: string | undefined = undefined;

      if ('token' in message && message.token) {
        userId = message.token.sub;
        sessionIdentifier = message.token.jti ?? message.token.sub;
      }
      logger.info({
        msg: 'signOut event triggered (JWT strategy)',
        sessionIdentifier,
        userId,
        correlationId,
      });
    },
    async createUser(message: { user: User }) {
      const correlationId = createCorrelationId('createUserEvent');
      logger.info({
        msg: 'createUser event triggered',
        userId: message.user.id,
        email: message.user.email,
        correlationId,
      });
    },
    async updateUser(message: { user: User }) {
      const correlationId = createCorrelationId('updateUserEvent');
      logger.info({ msg: 'updateUser event triggered', userId: message.user.id, correlationId });
    },
    async linkAccount(message: { user: User; account: Account }) {
      const correlationId = createCorrelationId('linkAccountEvent');
      logger.info({
        msg: 'linkAccount event triggered',
        userId: message.user.id,
        provider: message.account.provider,
        correlationId,
      });
    },
    async session(message: { session: Session | unknown }) {
      const correlationId = createCorrelationId('sessionEvent');
      const sessionId =
        typeof message.session === 'object' && message.session && 'id' in message.session
          ? (message.session as { id: string }).id
          : undefined;
      logger.debug({ msg: 'session event triggered', sessionId, correlationId });
    },
  },
  pages: {
    signIn: '/login', // Default sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Recommended for self-hosted, set to false if behind untrusted proxy
};

// Initialize NextAuth with the config and export the results
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Exporting the logger creation function directly if needed elsewhere
export { createContextLogger };
