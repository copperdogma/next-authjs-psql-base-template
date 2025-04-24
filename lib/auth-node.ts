import NextAuth, { type NextAuthConfig, type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma'; // Adjust path if necessary
import { defaultUserService } from './services/user-service'; // Adjust path if necessary
import { logger } from './logger'; // Import the shared logger
import { UserRole, User } from '.prisma/client';

// Helper function to attempt creating the test user with a specific UID
async function createTestUserWithUid(email: string, testUserUid: string): Promise<User | null> {
  logger.info({ msg: 'Attempting to create new test user with specified UID', testUserUid });
  try {
    const newUser = await prisma.user.create({
      data: {
        id: testUserUid,
        name: 'Test User',
        email: email,
        emailVerified: new Date(),
        role: 'USER'
      }
    });
    logger.info({ msg: 'Created new test user with specified UID', userId: newUser.id });
    return newUser;
  } catch (createError) {
    logger.error({
      msg: 'Failed to create test user with specified UID',
      error: createError,
      testUserUid
    });
    return null; // Failed to create
  }
}

// Helper function to find or create the test user for E2E testing
async function findOrCreateTestUser(email: string): Promise<User | null> {
  try {
    // 1. Attempt to find the user by email first
    let user = await defaultUserService.findUserByEmail(email);
    if (user) {
      logger.info({ msg: 'Found test user by email', userId: user.id });
      return user;
    }

    logger.warn({
      msg: 'Test user not found by email, attempting lookup/creation by UID',
      email
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
      email
    });
    return null;
  }
}

// Extend session to include user ID and role
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

export const authConfigNode: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Optional: If needed for linking accounts
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'E2E Test Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true';

        if (!isTestEnv) {
          logger.warn({
            msg: 'E2E Test Login not allowed in current environment',
            nodeEnv: process.env.NODE_ENV
          });
          return null;
        }

        logger.info({
          msg: 'E2E Test Login authorize callback invoked',
          isTestEnv,
          nodeEnv: process.env.NODE_ENV,
          isE2ETestEnv: process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV
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
          validPassword: password === process.env.TEST_USER_PASSWORD
        });

        const isValidCredentials =
          email === process.env.TEST_USER_EMAIL &&
          password === process.env.TEST_USER_PASSWORD;

        if (!isValidCredentials) {
          logger.warn({
            msg: 'Invalid E2E test credentials provided',
            email
          });
          return null;
        }

        // Call the helper function (now defined outside)
        const user = await findOrCreateTestUser(email);

        if (user) {
          logger.info({ msg: 'E2E Test Login successful', userId: user.id });
          return user;
        } else {
          logger.error({ msg: 'E2E Test Login failed: Could not find or create test user.', email });
          return null;
        }
      },
    }),
  ],
  cookies: {
    sessionToken: {
      // Use secure prefix in production, default name in test/dev
      name: process.env.NODE_ENV === 'production'
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days instead of 15 minutes
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: false,                      // Allow JS access to read token
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',                      // CSRF mitigation
        path: '/',                            // Ensure cookie sent for all routes
      },
    },
  },
  session: {
    strategy: 'jwt', // Use JWT for session strategy with Prisma adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days instead of 15 minutes
    updateAge: 60 * 15, // Update session every 15 minutes
  },
  callbacks: {
    async session({ session, token }) {
      logger.debug({ msg: 'Start session callback', token }); // Log incoming token
      if (token?.sub) {
        logger.debug({ msg: 'Assigning session.user.id from token.sub', sub: token.sub });
        session.user.id = token.sub;
      } else {
        logger.warn({ msg: 'token.sub is missing in session callback', token });
      }
      if (token?.role) {
        session.user.role = token.role as UserRole;
      }
      if (token?.name) {
        session.user.name = token.name;
      }
      logger.debug({ msg: 'End session callback', finalSessionUser: session.user }); // Log final session.user
      return session;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      logger.debug({ msg: 'Start jwt callback', hasUser: !!user, trigger, accountProvider: account?.provider }); // Log start
      if (user) {
        logger.debug({ msg: 'User object present in jwt callback', userId: user.id, userRole: user.role, userName: user.name });
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        logger.debug({ msg: 'Assigned token fields from user', sub: token.sub, role: token.role, name: token.name });
      } else {
        logger.debug({ msg: 'User object NOT present in jwt callback', trigger });
      }

      // Handle session update
      if (trigger === 'update' && session) {
        // Update token with the data sent from the client
        logger.debug({ msg: 'JWT callback on update', updatedSession: session });
        if (session.user?.name) {
          token.name = session.user.name;
        }
      }
      if (account?.provider === 'google' && profile) {
        logger.debug({ msg: 'JWT callback for Google provider', userId: token.sub });
      }

      return token;
    },
  },
  logger: {
    error(error: Error) {
      logger.error({ err: { message: error.message, stack: error.stack, name: error.name } }, 'NextAuth Error');
    },
    warn(code: string) {
      logger.warn({ code }, 'NextAuth Warning');
    },
    debug(code: string, metadata: unknown) {
      logger.debug({ code, metadata }, 'NextAuth Debug');
    },
  },
  pages: {
    signIn: '/login', // Redirect users to custom login page
  },
  debug: false, // Explicitly set debug to false for all environments
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode); 