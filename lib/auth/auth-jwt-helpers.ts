import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type Session, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import { type AuthUserInternal } from './auth-helpers';
import { defaultDependencies, type DbUserStepResult } from './auth-jwt-types';
import { prisma } from '@/lib/prisma';
import {
  performDbFindOrCreateUser,
  findOrCreateOAuthDbUser,
  createOAuthJwtPayload,
} from './oauth-helpers';
import {
  validateOAuthInputs,
  validateOAuthSignInInputs,
  validateOAuthRequestInputs,
  createFallbackToken,
} from './oauth-validation-helpers';

// Re-export for backward compatibility
export {
  validateOAuthInputs,
  performDbFindOrCreateUser,
  findOrCreateOAuthDbUser,
  validateOAuthSignInInputs,
  validateOAuthRequestInputs,
  createFallbackToken,
  createOAuthJwtPayload,
};

/**
 * Helper to safely extract user role or default to USER
 */
export function getUserRoleOrDefault(
  user: NextAuthUser | AdapterUser | Partial<AuthUserInternal>
): UserRole {
  // Check if user exists and has a role property that is a string
  if (user && typeof user.role === 'string') {
    // Check if the role string is a valid value in the UserRole enum
    if (Object.values(UserRole).includes(user.role as UserRole)) {
      return user.role as UserRole;
    }
    // Log warning if the role is present but invalid
    logger.warn({
      msg: 'User object has invalid role property, defaulting to USER.',
      userId: user.id, // Use user.id directly if available
      providedRole: user.role,
    });
  }
  // Default to USER if role is missing, not a string, or invalid
  return UserRole.USER;
}

/**
 * Helper to build AuthUserInternal from NextAuth user object
 */
export function buildAuthUserInternalFromCredentials(
  user: NextAuthUser | AdapterUser,
  correlationId: string
): AuthUserInternal | null {
  if (!user?.id || !user?.email) {
    logger.error({
      msg: 'User object missing required fields for building AuthUserInternal',
      userId: user?.id,
      email: user?.email,
      correlationId,
    });
    return null; // Return null to indicate failure
  }

  const role = getUserRoleOrDefault(user);

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    image: user.image ?? null,
    role: role,
  };
}

/**
 * Updates the JWT token fields based on the provided session user data.
 */
export function updateTokenFieldsFromSession(
  token: JWT,
  sessionUser: NonNullable<Session['user']> // Ensure user is not null/undefined
): JWT {
  let updatedToken = { ...token };

  // Update standard JWT claims if present in session user
  if (sessionUser.name) updatedToken.name = sessionUser.name;
  if (sessionUser.email) updatedToken.email = sessionUser.email;
  if (sessionUser.image) updatedToken.picture = sessionUser.image;

  // Update custom claims (ensure types match JWT structure)
  if (sessionUser.id) {
    updatedToken.sub = sessionUser.id; // Use 'sub' for user ID
    updatedToken.userId = sessionUser.id; // Keep custom 'userId' if needed
  }
  if (sessionUser.role && Object.values(UserRole).includes(sessionUser.role as UserRole)) {
    updatedToken.role = sessionUser.role as UserRole;
    updatedToken.userRole = sessionUser.role as UserRole; // Keep custom 'userRole' if needed
  } else if (sessionUser.role) {
    // Log if role exists but is invalid, retain existing token role or default if necessary
    logger.warn(
      { userId: sessionUser.id, providedRole: sessionUser.role },
      'Session user has invalid role, not updating token role.'
    );
  }

  // Add any other custom fields from session.user if needed
  // Example: updatedToken.customField = sessionUser.customField;

  return updatedToken;
}

/**
 * Finds or creates a user in the database from OAuth data and prepares the result.
 */
export async function findOrCreateOAuthDbUserStep(params: {
  user: NextAuthUser | AdapterUser;
  account: Account;
  profile?: Profile;
  correlationId: string;
  _baseToken: JWT; // Changed from baseToken to _baseToken
  dependencies: typeof defaultDependencies;
}): Promise<DbUserStepResult> {
  const { user, account, profile, correlationId, _baseToken, dependencies } = params;

  // Perform the database operation to find or create user
  const dbUser = await findOrCreateOAuthDbUser({
    user,
    account,
    profile,
    correlationId,
    dependencies,
  });

  // Check if the operation failed
  if (!dbUser) {
    // Return fallback token for error case
    return {
      success: false,
      fallbackToken: createFallbackToken(_baseToken, dependencies.uuidv4),
    };
  }

  // Return successful result with the found/created user
  return {
    success: true,
    dbUser,
  };
}

/**
 * Updates the lastSignedInAt timestamp for a user
 */
export async function updateLastSignedInAt(userId: string, logContext?: Record<string, unknown>) {
  try {
    // Use updateMany instead of update to avoid errors if column doesn't exist
    // updateMany will return successfully even if 0 rows were updated
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "lastSignedInAt" = NOW() 
      WHERE "id" = ${userId}
      AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'lastSignedInAt'
      )
    `;
    logger.info(
      { ...logContext, userId },
      '[JWT Callback] Successfully updated or skipped lastSignedInAt for user.'
    );
  } catch (error) {
    logger.warn(
      { ...logContext, userId, error },
      '[JWT Callback] Error updating lastSignedInAt for user. Field may not exist in schema.'
    );
    // Proceed anyway - lastSignedInAt is not critical for auth to work
  }
}

/**
 * Handle session refresh operations when a user signs in
 */
export async function handleSessionRefreshFlow(
  userId: string,
  logContext: Record<string, unknown>
): Promise<void> {
  // Update the last signed in timestamp
  await updateLastSignedInAt(userId, logContext);

  // Could add additional session refresh operations here
  // e.g., clean up old sessions, update other user data, etc.
}

/**
 * Ensures that a JWT token has a valid JTI (JWT ID) claim
 */
export function ensureJtiExists(
  token: JWT,
  correlationId: string,
  logContext: Record<string, unknown>
): JWT {
  // If token already has a JTI, return it unchanged
  if (token.jti) {
    return token;
  }

  // If no JTI, create a new one with UUID
  logger.debug({ correlationId, ...logContext }, 'JWT missing JTI claim, generating a new one');

  return {
    ...token,
    jti: defaultDependencies.uuidv4(), // Use the default implementation
  };
}
