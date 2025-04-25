import NextAuth, { type NextAuthConfig, type Account, type Profile } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma'; // Adjust path if necessary
import { defaultUserService } from './services/user-service'; // Adjust path if necessary
import { logger } from './logger'; // Import the shared logger
import { UserRole } from '@/types'; // Import the re-exported UserRole
import { User as PrismaUser } from '.prisma/client'; // Keep PrismaUser import separate
import { v4 as uuidv4 } from 'uuid';
import { type JWT } from '@auth/core/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import type { User as NextAuthUser } from 'next-auth'; // Import NextAuth User type explicitly
import { sharedAuthConfig } from './auth-shared'; // Import shared config

// ====================================
// Interfaces (Moved from helpers)
// ====================================

// Define interface for our custom AuthUser structure used internally (mapping from DB)
export interface AuthUserInternal {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// Define interface for parameters used in handleJwtSignIn
export interface HandleJwtSignInParams {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile | null;
  correlationId: string;
}

// Type for the arguments object for handleJwtSignIn result
export interface ValidateSignInResult {
  isValid: boolean;
  userId?: string | null;
  userEmail?: string | null;
}

// Interface for parameters for _createNewUserWithAccount
interface CreateNewUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  provider: string;
  providerAccountId: string;
  correlationId: string;
}

// Define interface for parameters used in findOrCreateUserAndAccountInternal
export interface FindOrCreateUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  providerAccountId: string;
  provider: string;
  correlationId: string;
}

// ====================================
// E2E Test User Helpers (Kept separate)
// ====================================

// Helper function to attempt creating the test user with a specific UID
async function createTestUserWithUid(
  email: string,
  testUserUid: string
): Promise<PrismaUser | null> {
  logger.info({ msg: 'Attempting to create new test user with specified UID', testUserUid });
  try {
    const newUser = await prisma.user.create({
      data: {
        id: testUserUid,
        name: 'Test User',
        email: email,
        emailVerified: new Date(),
        role: 'USER',
      },
    });
    logger.info({ msg: 'Created new test user with specified UID', userId: newUser.id });
    return newUser;
  } catch (createError) {
    logger.error({
      msg: 'Failed to create test user with specified UID',
      error: createError,
      testUserUid,
    });
    return null; // Failed to create
  }
}

// Helper function to find or create the test user for E2E testing
async function findOrCreateTestUser(email: string): Promise<PrismaUser | null> {
  try {
    // 1. Attempt to find the user by email first
    let user = await defaultUserService.findUserByEmail(email);
    if (user) {
      logger.info({ msg: 'Found test user by email', userId: user.id });
      return user;
    }

    logger.warn({
      msg: 'Test user not found by email, attempting lookup/creation by UID',
      email,
    });

    // 2. Check for TEST_USER_UID
    const testUserUid = process.env.TEST_USER_UID;
    if (!testUserUid) {
      logger.error({ msg: 'TEST_USER_UID not set, cannot proceed with UID lookup/creation.' });
      return null;
    }

    // 3. Try finding by UID
    user = await prisma.user.findUnique({ where: { id: testUserUid } });
    if (user) {
      logger.info({ msg: 'Found test user by UID', userId: user.id });
      return user;
    }

    // 4. Try creating the user with the specified UID
    return await createTestUserWithUid(email, testUserUid);
  } catch (error) {
    logger.error({
      msg: 'Error during user lookup/creation in E2E Test Login',
      error,
      email,
    });
    return null;
  }
}

// ====================================
// Auth Helper Functions (Merged from auth-helpers.ts and auth-jwt-helpers.ts)
// ====================================

// --- User/Account Management ---

// Creates an account for an existing user
async function _createAccountForExistingUser(
  userId: string,
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<void> {
  logger.info(
    { userId, provider, correlationId },
    '[_createAccountForExistingUser] Adding new provider account'
  );
  try {
    await prisma.account.create({
      data: {
        userId: userId,
        type: 'oauth', // Assuming OAuth
        provider: provider,
        providerAccountId: providerAccountId,
      },
    });
  } catch (error) {
    logger.error(
      { err: error, userId, provider, correlationId },
      '[_createAccountForExistingUser] Failed to add account'
    );
    throw error;
  }
}

// Creates a new user and account, returns structure needed for AuthUserInternal or null
async function _createNewUserWithAccount(
  params: CreateNewUserParams
): Promise<(Omit<AuthUserInternal, 'role'> & { role: UserRole }) | null> {
  const { email, profileData, provider, providerAccountId, correlationId } = params;
  logger.info(
    { email, provider, correlationId },
    '[_createNewUserWithAccount] Creating new user and account'
  );
  try {
    const newUser = await prisma.user.create({
      data: {
        id: profileData.id,
        email: email,
        name: profileData.name,
        image: profileData.image,
        role: 'USER', // Use string literal as expected by Prisma schema
        accounts: {
          create: {
            type: 'oauth',
            provider: provider,
            providerAccountId: providerAccountId,
          },
        },
      },
      select: { id: true, name: true, email: true, image: true, role: true }, // Select only needed fields
    });
    logger.info(
      { userId: newUser.id, correlationId },
      '[_createNewUserWithAccount] New user and account created successfully'
    );
    return { ...newUser, role: newUser.role as UserRole };
  } catch (error) {
    logger.error(
      { err: error, email, provider, correlationId },
      '[_createNewUserWithAccount] Failed to create user/account'
    );
    return null;
  }
}

/**
 * Handles an existing user: checks if the provider account exists and creates it if not.
 * @param dbUserWithAccounts - The existing user data including accounts.
 * @param provider - The OAuth provider name.
 * @param providerAccountId - The user's ID for the provider.
 * @param correlationId - Correlation ID for logging.
 * @returns The user data in AuthUserInternal format.
 */
async function _handleExistingUser(
  dbUserWithAccounts: PrismaUser & { accounts: { provider: string; providerAccountId: string }[] },
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<AuthUserInternal> {
  logger.info(
    { userId: dbUserWithAccounts.id, provider, correlationId },
    '[_handleExistingUser] Processing existing user'
  );
  const accountExists = dbUserWithAccounts.accounts.some(
    account => account.provider === provider && account.providerAccountId === providerAccountId
  );

  if (!accountExists) {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[_handleExistingUser] Account does not exist, creating...'
    );
    await _createAccountForExistingUser(
      dbUserWithAccounts.id,
      provider,
      providerAccountId,
      correlationId
    );
  } else {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[_handleExistingUser] Account already exists'
    );
  }

  // Convert Prisma user to internal format
  const resultUser: AuthUserInternal = {
    ...dbUserWithAccounts,
    role: dbUserWithAccounts.role as UserRole,
  };
  return resultUser;
}

// Finds or creates a user and associated account record.
async function findOrCreateUserAndAccountInternal({
  email,
  profileData,
  providerAccountId,
  provider,
  correlationId,
}: FindOrCreateUserParams): Promise<AuthUserInternal | null> {
  const logContext = { email, provider, correlationId };

  try {
    // 1. Find user by email, including their accounts
    const dbUserWithAccounts = await prisma.user.findUnique({
      where: { email },
      include: { accounts: { select: { provider: true, providerAccountId: true } } },
    });

    let resultUser: AuthUserInternal | null = null;

    if (dbUserWithAccounts) {
      // 2a. User exists: Handle potential new account linking
      resultUser = await _handleExistingUser(
        dbUserWithAccounts,
        provider,
        providerAccountId,
        correlationId
      );
    } else {
      // 2b. User does not exist: Create new user and account
      logger.info(logContext, '[findOrCreateUserInternal] User not found, attempting creation...');
      resultUser = await _createNewUserWithAccount({
        email,
        profileData,
        provider,
        providerAccountId,
        correlationId,
      });
    }

    // 3. Final check and return
    if (!resultUser) {
      logger.error(logContext, '[findOrCreateUserInternal] Failed to find or create user.');
      return null;
    }
    return resultUser;
  } catch (error) {
    logger.error({
      ...logContext,
      msg: '[findOrCreateUserInternal] Error during find/create process',
      error:
        error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    });
    return null;
  }
}

// --- JWT Callback Helpers ---

// Helper to validate signIn inputs
function validateSignInInputs(
  user: NextAuthUser | AdapterUser | null | undefined,
  account: Account | null | undefined,
  correlationId: string
): ValidateSignInResult {
  if (!user?.id || !user?.email) {
    logger.warn({ msg: 'Missing user ID or email during sign-in', user, correlationId });
    return { isValid: false };
  }
  if (!account?.provider || !account?.providerAccountId) {
    logger.warn({ msg: 'Missing account provider or providerAccountId', account, correlationId });
    return { isValid: false };
  }
  return { isValid: true, userId: user.id, userEmail: user.email };
}

// Helper to build the final JWT
function buildNewJwt(token: JWT, dbUser: AuthUserInternal): JWT {
  return {
    ...token,
    sub: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.image,
  };
}

// Helper to prepare profile data for DB insertion/update
// eslint-disable-next-line complexity
function _prepareProfileDataForDb(
  userId: string,
  userEmail: string,
  profile: Profile | null | undefined,
  user: NextAuthUser | AdapterUser | null | undefined
): { id: string; name?: string | null; email: string; image?: string | null } {
  let name: string | null = null;
  if (profile?.name) {
    name = profile.name;
  } else if (user?.name) {
    name = user.name;
  }

  let image: string | null = null;
  if (profile?.image && typeof profile.image === 'string') {
    image = profile.image;
  } else if (user?.image && typeof user.image === 'string') {
    image = user.image;
  }

  return {
    id: userId,
    email: userEmail,
    name: name,
    image: image,
  };
}

// Helper function for JWT signIn trigger
async function handleJwtSignIn(params: HandleJwtSignInParams): Promise<JWT> {
  const { token, user, account, profile, correlationId } = params;

  const validation = validateSignInInputs(user, account, correlationId);
  if (!validation.isValid || !validation.userId || !validation.userEmail) {
    return {}; // Return empty token if validation fails
  }

  if (!account || !user) {
    logger.error({
      msg: 'Account or User object unexpectedly missing after validation',
      correlationId,
    });
    return {};
  }

  const { userId, userEmail } = validation;
  logger.info({
    msg: 'Initial sign-in detected',
    userId,
    provider: account.provider,
    correlationId,
  });

  const profileDataForDb = _prepareProfileDataForDb(userId, userEmail, profile, user);

  const dbUser = await findOrCreateUserAndAccountInternal({
    email: userEmail,
    profileData: profileDataForDb,
    providerAccountId: account.providerAccountId,
    provider: account.provider,
    correlationId,
  });

  if (!dbUser) {
    logger.error({
      msg: 'Failed find/create user during sign-in',
      email: userEmail,
      provider: account.provider,
      correlationId,
    });
    return {};
  }

  return buildNewJwt(token, dbUser);
}

// Helper function for JWT update trigger
async function handleJwtUpdate(token: JWT, correlationId: string): Promise<JWT> {
  if (!token.sub) {
    logger.warn({ msg: 'JWT update trigger skipped, missing sub (user ID)', correlationId });
    return token;
  }

  logger.info({ msg: 'JWT update trigger', userId: token.sub, correlationId });

  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (dbUser) {
    const authUserInternal: AuthUserInternal = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      role: dbUser.role as UserRole,
    };
    const updatedToken = buildNewJwt(token, authUserInternal);
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
    return token;
  }
}

// ====================================
// NextAuth Configuration (Node.js Runtime)
// ====================================

// Remove the local declare module block as it's now in auth-shared.ts
/*
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
  }
}
*/

export const authConfigNode: NextAuthConfig = {
  // Spread the shared configuration first
  ...sharedAuthConfig,

  // Add Node.js specific configurations
  adapter: PrismaAdapter(prisma),
  providers: [
    // Include shared providers (Google is already in sharedAuthConfig)
    ...(sharedAuthConfig.providers || []), // Spread shared providers
    // Add Node-specific providers (E2E Credentials)
    Credentials({
      name: 'E2E Test Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<PrismaUser | null> {
        const isTestEnv =
          process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true';

        if (!isTestEnv) {
          logger.warn({
            msg: 'E2E Test Login not allowed in current environment',
            nodeEnv: process.env.NODE_ENV,
          });
          return null;
        }

        logger.info({
          msg: 'E2E Test Login authorize callback invoked',
          isTestEnv,
          nodeEnv: process.env.NODE_ENV,
          isE2ETestEnv: process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV,
        });

        const email = credentials?.email as string;
        const password = credentials?.password as string;

        logger.debug({
          msg: 'E2E Test Login credentials received',
          email,
          testEmail: process.env.TEST_USER_EMAIL,
          hasPassword: !!password,
          hasTestPassword: !!process.env.TEST_USER_PASSWORD,
          validEmail: email === process.env.TEST_USER_EMAIL,
          validPassword: password === process.env.TEST_USER_PASSWORD,
        });

        const isValidCredentials =
          email === process.env.TEST_USER_EMAIL && password === process.env.TEST_USER_PASSWORD;

        if (!isValidCredentials) {
          logger.warn({
            msg: 'Invalid E2E test credentials provided',
            email,
          });
          return null;
        }

        // Use the E2E helper function defined above
        const user = await findOrCreateTestUser(email);

        if (user) {
          logger.info({ msg: 'E2E Test Login successful', userId: user.id });
          return user;
        } else {
          logger.error({
            msg: 'E2E Test Login failed: Could not find or create test user.',
            email,
          });
          return null;
        }
      },
    }),
  ],
  cookies: {
    // Potentially override or add specific cookie settings if needed
    ...sharedAuthConfig.cookies, // Include shared cookie settings
    sessionToken: {
      // Override maxAge for Node session token if necessary
      ...(sharedAuthConfig.cookies?.sessionToken || {}),
      options: {
        ...(sharedAuthConfig.cookies?.sessionToken?.options || {}),
        maxAge: 30 * 24 * 60 * 60, // 30 days session timeout for Node
      },
    },
    // Define CSRF token specifically for Node (if needed differently from Edge)
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token' // Use __Host- prefix for added security
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true, // Make CSRF token HttpOnly
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  session: {
    // Override or add specific session settings
    ...sharedAuthConfig.session,
    maxAge: 30 * 24 * 60 * 60, // 30 days session timeout
    updateAge: 60 * 15, // Update session JWT every 15 minutes
  },
  callbacks: {
    // Include shared callbacks
    ...sharedAuthConfig.callbacks,
    // Define Node-specific JWT callback
    // eslint-disable-next-line complexity
    async jwt({ token, user, account, profile, trigger, session }) {
      // Use correlation ID for consistency in logs for a single request
      const correlationId = uuidv4();

      logger.debug({
        msg: 'Start jwt callback (Node)',
        hasUser: !!user,
        trigger,
        accountProvider: account?.provider,
        correlationId,
      });

      // Use the helper functions defined above for specific logic
      if (account && user && trigger === 'signIn') {
        return handleJwtSignIn({ token, user, account, profile, correlationId });
      }
      if (user && trigger === 'signIn' && !account) {
        // Credentials provider sign-in
        logger.info({
          msg: 'JWT callback triggered for Credentials sign-in (Node)',
          userId: user.id,
          correlationId,
        });
        const prismaUser = user as unknown as PrismaUser; // Use unknown cast as fallback if direct fails
        return {
          ...token,
          sub: prismaUser.id,
          role: prismaUser.role as UserRole, // Cast Prisma role to imported UserRole
          email: prismaUser.email,
          name: prismaUser.name,
          picture: prismaUser.image,
        };
      }
      if (trigger === 'update' && session) {
        return await handleJwtUpdate(token, correlationId);
      }
      if (token.sub && !user && !trigger) {
        // Token validation/refresh check
        logger.debug({
          msg: 'JWT callback invoked for token validation/refresh (Node)',
          sub: token.sub,
          correlationId,
        });
        // return await handleJwtUpdate(token, correlationId); // Optional: Refresh on every access
      }

      logger.debug({
        msg: 'End jwt callback (Node - no specific action)',
        tokenSub: token.sub,
        correlationId,
      });
      return token;
    },
    // session callback is inherited from sharedAuthConfig
  },
  // Add events if needed for Node-specific logging/handling
  events: {
    async signIn(message) {
      logger.info({
        msg: 'User signed in (Node)',
        userId: message.user.id,
        provider: message.account?.provider,
      });
    },
    async signOut(message) {
      // Check if 'session' exists and try to get userId from it
      const sessionId =
        'session' in message && message.session?.userId ? message.session.userId : undefined;
      logger.info({ msg: 'User signed out (Node)', sessionId });
    },
  },
  // Add logger configuration if needed, though logger might be globally configured
  // logger: {
  //   error(error: Error) { logger.error({ err: error, component: 'NextAuthNode' }, 'NextAuth Node Error'); },
  //   warn(code: string) { logger.warn({ code, component: 'NextAuthNode' }, 'NextAuth Node Warning'); },
  //   debug(code: string, metadata: unknown) { logger.debug({ code, metadata, component: 'NextAuthNode' }, 'NextAuth Node Debug'); },
  // },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode);
