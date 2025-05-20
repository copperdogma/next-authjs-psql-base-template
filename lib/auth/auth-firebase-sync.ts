import { logger } from '@/lib/logger';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import type { Account, Profile, User as NextAuthUser } from 'next-auth';
import { isObject } from '../utils/type-guards';

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

// Helper to log and return for skipping sync
function _logSkipSync(
  reason: string,
  logContext: Record<string, unknown>,
  details?: Record<string, unknown>,
  logLevel: 'info' | 'warn' | 'debug' = 'info'
): false {
  if (logLevel === 'warn') {
    logger.warn(
      { ...logContext, ...details },
      `[JWT Callback] Skipping Firebase OAuth Sync: ${reason}`
    );
  } else if (logLevel === 'debug') {
    logger.debug(
      { ...logContext, ...details },
      `[JWT Callback] Skipping Firebase OAuth Sync: ${reason}`
    );
  } else {
    logger.info(
      { ...logContext, ...details },
      `[JWT Callback] Skipping Firebase OAuth Sync: ${reason}`
    );
  }
  return false;
}

// Helper function to handle logging and skipping for non-OAuth sync cases
function _handleNonOAuthSync(
  trigger: string | undefined,
  account: Account | null,
  baseLogContext: { trigger: string | undefined; correlationId: string }
): false {
  const isCredentialsProvider = account?.provider === 'credentials';
  const logLevel = isCredentialsProvider ? 'debug' : 'info';
  const reason = `Provider '${account?.provider}' (type: '${account?.type}') is not OAuth/OIDC. ${isCredentialsProvider ? 'This is normal for credentials-based sign-in.' : ''}`;
  return _logSkipSync(
    reason,
    baseLogContext,
    { provider: account?.provider, accountType: account?.type },
    logLevel
  );
}

// Validate prerequisites for Firebase sync
function _validateSyncPrerequisites(
  authContext: {
    trigger: string | undefined;
    account: Account | null; // account can be null for credentials
    user: NextAuthUser;
  },
  baseLogContext: { trigger: string | undefined; correlationId: string }
): boolean {
  const { trigger, account, user } = authContext;

  // Check for valid user object with ID
  if (!isObject(user) || !user?.id) {
    return _logSkipSync(
      'User ID is missing or user object is invalid.',
      baseLogContext,
      { user },
      'warn'
    );
  }

  // For non-OAuth auth types, skip sync without warning - this is normal for credentials
  if (!shouldSyncFirebaseUser(trigger, account?.type)) {
    return _handleNonOAuthSync(trigger, account, baseLogContext);
  }
  return true;
}

// Main function to sync Firebase user
export async function syncFirebaseUserForOAuth(
  authContext: {
    trigger: string | undefined;
    account: Account; // In this context, account is expected to be present due to shouldSyncFirebaseUser
    user: NextAuthUser;
    profile: Profile | undefined;
  },
  baseLogContext: { trigger: string | undefined; correlationId: string }
): Promise<void> {
  if (!_validateSyncPrerequisites(authContext, baseLogContext)) {
    return; // Prerequisites not met, already logged
  }

  // Destructure after validation ensures user.id and account are somewhat safe to access,
  // though account might still need checks if _validateSyncPrerequisites logic changes.
  const { user, profile, account } = authContext; // account is now from authContext
  const userId = user.id as string; // user.id is confirmed by _validateSyncPrerequisites

  const oauthLogContext = { ...baseLogContext, userId, provider: account.provider }; // account.provider should be safe here
  logger.info(oauthLogContext, '[JWT Callback] Conditions met for Firebase OAuth Sync');

  if (!checkFirebaseAdminStatus(oauthLogContext)) {
    return; // Status check failed, already logged
  }

  const userPayload = prepareFirebaseUserPayload(userId, profile, user, oauthLogContext);
  if (!userPayload) {
    return; // Payload prep failed, already logged
  }

  await createFirebaseUserIfNeeded(userPayload, oauthLogContext);
}
