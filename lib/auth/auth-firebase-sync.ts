import { logger } from '@/lib/logger';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import type { Account, Profile, User as NextAuthUser } from 'next-auth';

// Helper function to determine if Firebase user sync should occur
export function shouldSyncFirebaseUser(
  trigger: string | undefined,
  accountType: string | undefined
): boolean {
  return (
    (trigger === 'signIn' || trigger === 'signUp') &&
    (accountType === 'oauth' || accountType === 'oidc')
  );
}

// Check if Firebase Admin service is ready
function checkFirebaseAdminStatus(logContext: Record<string, unknown>): boolean {
  const authService = getFirebaseAdminAuth();
  if (!authService) {
    logger.error(
      logContext,
      '[JWT Callback] Firebase Admin Auth Service not available. Skipping user sync'
    );
    return false;
  }
  return true;
}

// Helper to get email address from profile or user
function getEmailForFirebase(
  profile: Profile | undefined,
  user: NextAuthUser,
  logContext: Record<string, unknown>
): string | null {
  const email = profile?.email || user.email;
  if (!email) {
    logger.error(
      { ...logContext, userId: user.id },
      '[JWT Callback] Cannot prepare Firebase user data: email is missing'
    );
    return null;
  }
  return email;
}

// Helper to determine if email is verified
function isEmailVerified(profile: Profile | undefined, user: NextAuthUser): boolean {
  return (
    profile?.email_verified === true ||
    ('emailVerified' in user && user.emailVerified instanceof Date)
  );
}

// Prepare Firebase user payload from profile and user data
function prepareFirebaseUserPayload(
  userId: string,
  profile: Profile | undefined,
  user: NextAuthUser,
  logContext: Record<string, unknown>
): {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | undefined;
  emailVerified: boolean;
} | null {
  // Get email (with validation)
  const email = getEmailForFirebase(profile, user, logContext);
  if (!email) return null;

  // Build Firebase user payload
  return {
    uid: userId,
    email,
    displayName: profile?.name || user.name || email || 'User',
    photoURL: profile?.picture || user.image || undefined,
    emailVerified: isEmailVerified(profile, user),
  };
}

// Create Firebase user if not found
async function createFirebaseUserIfNeeded(
  userPayload: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
  },
  logContext: Record<string, unknown>
): Promise<void> {
  const userId = userPayload.uid;
  const authService = getFirebaseAdminAuth();

  if (!authService) {
    logger.error(
      logContext,
      '[JWT Callback] Firebase Admin Auth Service not available in createFirebaseUserIfNeeded. Cannot create/check user.'
    );
    return;
  }

  try {
    await authService.getUser(userId); // USE NEW SERVICE
    logger.info(logContext, '[JWT Callback] Firebase user already exists');
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;

    if (errorCode === 'auth/user-not-found') {
      try {
        await authService.createUser(userPayload); // USE NEW SERVICE
        logger.info(logContext, '[JWT Callback] Successfully created Firebase user');
      } catch (creationError) {
        logger.error(
          { ...logContext, error: creationError },
          '[JWT Callback] Error during Firebase user creation'
        );
      }
    } else {
      logger.error(
        { ...logContext, error },
        '[JWT Callback] Unexpected error checking Firebase user existence'
      );
    }
  }
}

// Main function to sync Firebase user
export async function syncFirebaseUserForOAuth(
  authContext: {
    trigger: string | undefined;
    account: Account;
    user: NextAuthUser;
    profile: Profile | undefined;
  },
  baseLogContext: { trigger: string | undefined; correlationId: string }
): Promise<void> {
  const { trigger, account, user, profile } = authContext;

  // Skip if conditions not met or user ID missing
  if (!shouldSyncFirebaseUser(trigger, account?.type) || !user?.id) {
    logger.warn(
      baseLogContext,
      '[JWT Callback] Conditions not met for Firebase OAuth Sync or user ID missing'
    );
    return;
  }

  const userId = user.id;
  const oauthLogContext = { ...baseLogContext, userId, provider: account.provider };
  logger.info(oauthLogContext, '[JWT Callback] Conditions met for Firebase OAuth Sync');

  // Check Firebase admin status using the new function
  if (!checkFirebaseAdminStatus(oauthLogContext)) {
    return;
  }

  // Prepare user data
  const userPayload = prepareFirebaseUserPayload(userId, profile, user, oauthLogContext);
  if (!userPayload) {
    return;
  }

  // Create or update user in Firebase, using the imported singleton directly
  await createFirebaseUserIfNeeded(userPayload, oauthLogContext);
}
