import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sharedAuthConfig } from './auth-shared';
import {
  authorizeLogic,
  CredentialsSchema,
  type AuthorizeDependencies,
} from './auth/auth-credentials';
import { handleJwtSignIn, handleJwtUpdate } from './auth/auth-jwt';
import {
  updateLastSignedInAt,
  handleSessionRefreshFlow,
  ensureJtiExists,
} from './auth/auth-jwt-helpers';
import { syncFirebaseUserForOAuth } from './auth/auth-firebase-sync';
import type { Account, Profile, User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// ====================================
// Interfaces (Should be minimal or none)
// ====================================
// Validator interface moved to auth-credentials.ts
// AuthorizeDependencies interface moved to auth-credentials.ts

// ====================================
// Auth Helper Functions
// ====================================

// Prepare dependencies for authorizeLogic
const dependencies: AuthorizeDependencies = {
  db: {
    user: {
      findUnique: prisma.user.findUnique,
    },
  },
  hasher: {
    compare: bcrypt.compare,
  },
  validator: {
    safeParse: CredentialsSchema.safeParse,
  },
  uuidv4: uuidv4,
};

// Handle auth flow for sign-in/sign-up
async function _handleSignInSignUpFlow(params: {
  processedToken: JWT;
  user: NextAuthUser;
  account: Account;
  profile?: Profile;
  trigger: 'signIn' | 'signUp';
  correlationId: string;
}) {
  const { processedToken, user, account, profile, trigger, correlationId } = params;
  const baseLogContext = { trigger, correlationId };

  logger.info(baseLogContext, '[JWT Callback] Entering Sign-in/Sign-up flow logic block...');

  // Process the token with user/account data
  const updatedToken = await handleJwtSignIn({
    token: processedToken,
    user,
    account,
    profile,
    trigger,
    correlationId,
  });

  logger.info(baseLogContext, '[JWT Callback] handleJwtSignIn completed.');

  // Update lastSignedInAt for new sign-in/sign-up
  if ((trigger === 'signIn' || trigger === 'signUp') && user.id) {
    await updateLastSignedInAt(user.id, baseLogContext);
  }

  // Call the imported helper function for Firebase sync
  await syncFirebaseUserForOAuth({ trigger, account, user, profile }, baseLogContext);

  return updatedToken;
}

// Process token based on the current flow
async function _processTokenForFlow(
  initialToken: JWT,
  params: {
    user?: NextAuthUser | null;
    account?: Account | null;
    profile?: Profile | undefined;
    trigger?: string;
    session?: Session;
  },
  correlationId: string
): Promise<JWT> {
  const { user, account, profile, trigger, session } = params;
  const baseLogContext = { trigger, correlationId };

  // Start with a copy of the original token
  let processedToken = { ...initialToken };

  // Handle different flows based on parameters
  if (user && account) {
    // 1. Sign-in/Sign-up flow (user and account are present)
    processedToken = await _handleSignInSignUpFlow({
      processedToken,
      user: user as NextAuthUser,
      account,
      profile,
      trigger: trigger as 'signIn' | 'signUp',
      correlationId,
    });
  } else if (trigger === 'update' && session) {
    // 2. Session update flow (trigger = 'update')
    logger.info(baseLogContext, '[JWT Callback] Update flow');
    processedToken = await handleJwtUpdate(processedToken, session, correlationId, { uuidv4 });
  } else if (trigger === 'signIn' && processedToken.sub) {
    // 3. Session get flow or subsequent OAuth sign-in for existing user
    await handleSessionRefreshFlow(processedToken.sub, baseLogContext);
  } else {
    // 4. Other flow (no specific action needed)
    logger.debug(baseLogContext, '[JWT Callback] Other flow (no specific update action needed).');
  }

  // Ensure JTI exists on token
  processedToken = ensureJtiExists(processedToken, correlationId, baseLogContext);

  return processedToken;
}

// Extend the shared config with node-specific parts
export const authConfigNode: NextAuthConfig = {
  ...sharedAuthConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(sharedAuthConfig.providers || []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const logContext = {
          credentialType: typeof credentials,
          correlationId: uuidv4(), // Generate a correlation ID for this request
        };
        logger.info(logContext, '[CredentialsProvider] Authorize method called with credentials.');
        try {
          // Delegate to the standalone authorizeLogic function
          const user = await authorizeLogic(credentials, dependencies, logContext);
          if (user) {
            logger.info(
              { ...logContext, userId: user.id },
              '[CredentialsProvider] User authorized successfully.'
            );
            return user;
          } else {
            logger.warn(
              logContext,
              '[CredentialsProvider] Authorization failed, user not found or password mismatch.'
            );
            return null;
          }
        } catch (error) {
          logger.error(
            { ...logContext, error },
            '[CredentialsProvider] Error during authorization.'
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...sharedAuthConfig.callbacks, // Inherit shared session callback

    async jwt({ token, user, account, profile, trigger, session }) {
      const correlationId = uuidv4();
      const baseLogContext = { trigger, correlationId };

      // Log initial state for debugging
      logger.info(
        {
          ...baseLogContext,
          hasToken: !!token,
          hasUser: !!user,
          hasAccount: !!account,
          hasProfile: !!profile,
          hasSession: !!session,
          user: user ? { id: user.id, email: user.email } : null,
          account: account ? { type: account.type, provider: account.provider } : null,
        },
        '[JWT Callback] Invoked - Detailed Initial State'
      );

      // Process the token through the appropriate flow
      return _processTokenForFlow(
        token,
        { user, account, profile, trigger, session },
        correlationId
      );
    },
    // Session callback is inherited from sharedAuthConfig
  },
  // Other configurations like pages, adapter etc.
  session: {
    strategy: 'jwt', // Explicitly JWT for Node.js, though shared should also be JWT
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode);
// logger.info('[Auth Node] Auth configuration initialized.');

// Legacy/Helper User Service (Consider for refactoring or removal if adapter handles all)
// This is primarily for internal use by auth logic, not a general-purpose user service.
// ... (rest of the file, e.g., findOrCreateUserAndAccountInternal, etc.)
// export { findOrCreateUserAndAccountInternal }; // Not exporting as it's internal
