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
import { firebaseAdminServiceImpl } from '@/lib/server/services/firebase-admin.service';
import { type FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';
import type { Account, Profile, User as NextAuthUser } from 'next-auth';

// ====================================
// Interfaces (Should be minimal or none)
// ====================================
// Validator interface moved to auth-credentials.ts
// AuthorizeDependencies interface moved to auth-credentials.ts

// ====================================
// Auth Helper Functions (None should remain)
// ====================================
// authorizeLogic moved to auth-credentials.ts

// ====================================
// Node-Specific Auth Configuration (Core Purpose of this file now)
// ====================================
// CredentialsSchema moved to auth-credentials.ts

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

// Prepare dependencies for handleJwtSignIn
// const jwtSignInDependencies = { // Removed unused variable
//   findOrCreateUser: findOrCreateUserAndAccountInternal,
//   prepareProfile: prepareProfileDataForDb,
//   validateInputs: validateSignInInputs,
//   uuidv4: uuidv4,
// };

// Interface for the new auth context object
interface SyncFirebaseUserAuthContext {
  trigger: string | undefined;
  account: Account;
  user: NextAuthUser;
  profile: Profile | undefined;
}

// Helper function to determine if Firebase user sync should occur
function shouldSyncFirebaseUser(
  trigger: string | undefined,
  accountType: string | undefined
): boolean {
  return (
    (trigger === 'signIn' || trigger === 'signUp') &&
    (accountType === 'oauth' || accountType === 'oidc')
  );
}

// Helper to get a display name from available sources
function getDisplayName(profile: Profile | undefined, user: NextAuthUser): string {
  return profile?.name || user.name || user.email || 'User';
}

// Helper to get a photo URL from available sources
function getPhotoUrl(profile: Profile | undefined, user: NextAuthUser): string | undefined {
  return profile?.picture || user.image || undefined;
}

// Helper function to prepare Firebase user data
function prepareFirebaseUserData(
  userId: string,
  profile: Profile | undefined,
  user: NextAuthUser
): {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | undefined;
  emailVerified: boolean;
} | null {
  let isEmailVerified = false;
  if (profile?.email_verified === true) {
    isEmailVerified = true;
  } else if ('emailVerified' in user && user.emailVerified instanceof Date) {
    isEmailVerified = true;
  }

  const emailForFirebase = profile?.email || user.email;
  if (!emailForFirebase) {
    return null; // Email is essential
  }

  return {
    uid: userId,
    email: emailForFirebase,
    displayName: getDisplayName(profile, user),
    photoURL: getPhotoUrl(profile, user),
    emailVerified: isEmailVerified,
  };
}

// Type for the successfully prepared Firebase user payload
type FirebaseUserPayload = NonNullable<ReturnType<typeof prepareFirebaseUserData>>;

// Helper function to ensure Firebase user exists
async function ensureFirebaseUserExists(
  userId: string, // Retained as it's key for getUser and logging
  firebaseUserPayload: FirebaseUserPayload, // Combined profile and user info
  currentFbService: FirebaseAdminServiceInterface,
  logContext: Record<string, unknown>
): Promise<void> {
  try {
    await currentFbService.getUser(userId); // userId is still directly available
    logger.info(logContext, '[JWT Callback - Firebase Sync] Firebase user already exists.');
  } catch (error: unknown) {
    let errorCode: string | undefined = undefined;
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      errorCode = error.code;
    }
    logger.warn(
      { ...logContext, error },
      '[JWT Callback - Firebase Sync] Error during getUser check'
    );

    if (errorCode === 'auth/user-not-found') {
      logger.info(
        logContext,
        '[JWT Callback - Firebase Sync] Firebase user not found. Attempting creation...'
      );
      // firebaseUserPayload is already prepared and validated (for email) before calling this function
      try {
        await currentFbService.createUser(firebaseUserPayload);
        logger.info(
          logContext,
          '[JWT Callback - Firebase Sync] Successfully created Firebase user.'
        );
      } catch (creationError: unknown) {
        logger.error(
          { ...logContext, error: creationError },
          '[JWT Callback - Firebase Sync] Error during Firebase user creation.'
        );
      }
    } else {
      logger.error(
        { ...logContext, error },
        '[JWT Callback - Firebase Sync] Unexpected Error checking Firebase user existence.'
      );
    }
  }
}

// Extracted helper to attempt the actual Firebase sync if admin SDK is initialized
async function attemptFirebaseUserSync(
  userId: string,
  firebaseUserPayload: FirebaseUserPayload,
  currentFbService: FirebaseAdminServiceInterface | undefined, // Can be undefined here
  oauthLogContext: Record<string, unknown>
): Promise<void> {
  const isAdminInitialized = currentFbService && currentFbService.isInitialized();
  logger.info(
    { ...oauthLogContext, isAdminInitialized },
    '[JWT Callback - Firebase Sync] Checking Firebase Admin SDK initialization status'
  );

  if (isAdminInitialized && currentFbService) {
    logger.info(
      oauthLogContext,
      '[JWT Callback - Firebase Sync] Admin SDK Initialized. Proceeding with user sync...'
    );
    await ensureFirebaseUserExists(userId, firebaseUserPayload, currentFbService, oauthLogContext);
  } else {
    logger.error(
      oauthLogContext,
      '[JWT Callback - Firebase Sync] Firebase Admin Service NOT initialized. Skipping user sync.'
    );
  }
}

// Helper function to sync Firebase user for OAuth
async function _syncFirebaseUserForOAuth(
  authContext: SyncFirebaseUserAuthContext,
  baseLogContext: { trigger: string | undefined; correlationId: string }
): Promise<void> {
  const { trigger, account, user, profile } = authContext;

  logger.info(baseLogContext, '[JWT Callback] Checking conditions for Firebase OAuth Sync...');
  logger.info(
    { ...baseLogContext, trigger, accountType: account?.type, userId: user?.id },
    '[JWT Callback] Firebase OAuth Sync Condition Values'
  );

  if (!shouldSyncFirebaseUser(trigger, account?.type) || !user?.id) {
    logger.warn(
      baseLogContext,
      '[JWT Callback] CONDITIONS NOT MET for Firebase OAuth Sync or user ID missing.'
    );
    return;
  }

  logger.info(baseLogContext, '[JWT Callback] CONDITIONS MET for Firebase OAuth Sync.');
  const userId = user.id;
  const oauthLogContext = { ...baseLogContext, userId, provider: account.provider };

  const firebaseUserPayload = prepareFirebaseUserData(userId, profile, user);
  if (!firebaseUserPayload) {
    logger.error(
      { ...oauthLogContext, userId },
      '[JWT Callback - Firebase Sync] Cannot prepare Firebase user data: email is missing.'
    );
    return;
  }

  const currentFbService: FirebaseAdminServiceInterface | undefined = firebaseAdminServiceImpl;
  // Call the new extracted helper
  await attemptFirebaseUserSync(userId, firebaseUserPayload, currentFbService, oauthLogContext);
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
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        logger.debug(
          { provider: 'credentials' },
          '[Credentials Provider] Authorize function invoked'
        );
        try {
          const user = await authorizeLogic(credentials, dependencies);
          if (user) {
            logger.info(
              { provider: 'credentials', userId: user.id },
              '[Credentials Provider] Authorization successful'
            );
            return user;
          } else {
            logger.warn(
              { provider: 'credentials', email: credentials?.email },
              '[Credentials Provider] Authorization failed (null user returned)'
            );
            return null;
          }
        } catch (error: unknown) {
          logger.error(
            {
              provider: 'credentials',
              err: error instanceof Error ? error.message : String(error),
            },
            '[Credentials Provider] Error during authorization'
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...sharedAuthConfig.callbacks,
    async jwt({ token, user, account, profile, trigger, session }) {
      const correlationId = uuidv4();
      logger.info(
        {
          trigger,
          correlationId,
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

      const baseLogContext = { trigger, correlationId };
      let processedToken = { ...token };

      if (user && account) {
        logger.info(baseLogContext, '[JWT Callback] Entering Sign-in/Sign-up flow logic block...');
        processedToken = await handleJwtSignIn({
          token: processedToken,
          user,
          account,
          profile,
          trigger,
          correlationId,
        });
        logger.info(baseLogContext, '[JWT Callback] handleJwtSignIn completed.');

        // Call the extracted helper function with the new signature
        await _syncFirebaseUserForOAuth(
          { trigger, account, user, profile }, // Pass grouped auth context
          baseLogContext
        );
      }
      // 2. Session update flow (trigger = 'update')
      else if (trigger === 'update' && session) {
        logger.info(baseLogContext, '[JWT Callback] Update flow');
        processedToken = await handleJwtUpdate(processedToken, session, correlationId, { uuidv4 });
      }
      // 3. Session get flow (no specific trigger or only token available)
      else {
        logger.debug(baseLogContext, '[JWT Callback] Session get/refresh flow');
      }

      // Ensure JTI exists on final token if not already present
      if (!processedToken.jti) {
        processedToken.jti = uuidv4();
      }

      return processedToken;
    },
  },
  events: {
    ...sharedAuthConfig.events,
  },
};

// Initialize NextAuth with the final configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode);
