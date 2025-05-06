import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type Session, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import {
  prepareProfileDataForDb,
  validateSignInInputs,
  type AuthUserInternal,
} from './auth-helpers';
import { defaultDependencies, type OAuthDbUser, type DbUserStepResult } from './auth-jwt-types';

/**
 * Validates the essential user and account details for OAuth user creation.
 */
export function validateOAuthInputs(
  user: NextAuthUser | AdapterUser | null | undefined,
  account: Account | null | undefined,
  correlationId: string
): { isValid: boolean; userId?: string; userEmail?: string } {
  const userId = user?.id;
  const userEmail = user?.email;

  if (!userId || !userEmail || !account) {
    logger.error({
      correlationId,
      userId: userId,
      userEmail: userEmail,
      accountId: account?.providerAccountId,
      provider: account?.provider,
      msg: 'User ID, email, or account is missing, cannot proceed with findOrCreateUser.',
    });
    return { isValid: false };
  }
  return { isValid: true, userId, userEmail };
}

/**
 * Interacts with the database to find or create a user based on OAuth details.
 */
export async function performDbFindOrCreateUser(params: {
  email: string;
  profileData: ReturnType<typeof prepareProfileDataForDb> | { id: string; email: string };
  providerAccountId: string;
  provider: string;
  correlationId: string;
  dependencies: {
    findOrCreateUser: typeof defaultDependencies.findOrCreateUser;
  };
}): Promise<AuthUserInternal | null> {
  const { email, profileData, providerAccountId, provider, correlationId, dependencies } = params;
  try {
    const dbUser = await dependencies.findOrCreateUser({
      email,
      profileData,
      providerAccountId,
      provider,
      correlationId,
    });

    if (!dbUser || !dbUser.id || !dbUser.email) {
      logger.error(
        { correlationId, provider },
        'Failed to find or create user during OAuth DB operation'
      );
      return null;
    }
    return dbUser;
  } catch (error) {
    logger.error(
      {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        provider,
      },
      'Error during database find or create user operation'
    );
    return null;
  }
}

/**
 * Finds or creates a user in the database from OAuth data.
 * Orchestrates validation, profile preparation, and DB interaction.
 */
export async function findOrCreateOAuthDbUser(params: {
  user: NextAuthUser | AdapterUser;
  account: Account;
  profile?: Profile;
  correlationId: string;
  dependencies?: typeof defaultDependencies;
}): Promise<OAuthDbUser | null> {
  const { user, account, profile, correlationId, dependencies } = params;
  const deps = dependencies || defaultDependencies;

  // 1. Validate Inputs
  const validationResult = validateOAuthInputs(user, account, correlationId);
  if (!validationResult.isValid) {
    return null;
  }
  const { userId, userEmail } = validationResult as { userId: string; userEmail: string }; // Type assertion after validation

  // 2. Prepare Profile Data
  const preparedProfile = profile
    ? deps.prepareProfile(userId, userEmail, profile, user)
    : { id: userId, email: userEmail }; // Minimal profile if original is absent

  // 3. Perform DB Operation
  const dbUser = await performDbFindOrCreateUser({
    email: userEmail,
    profileData: preparedProfile,
    providerAccountId: account.providerAccountId,
    provider: account.provider,
    correlationId,
    dependencies: { findOrCreateUser: deps.findOrCreateUser }, // Pass only necessary dependency
  });

  if (!dbUser) {
    // Error already logged in performDbFindOrCreateUser
    return null;
  }

  // 4. Format and Return Result
  return {
    userId: dbUser.id,
    userEmail: dbUser.email,
    name: dbUser.name ?? undefined,
    image: dbUser.image ?? undefined,
    role: (dbUser.role as UserRole) ?? undefined,
  } as OAuthDbUser;
}

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
 * Validates inputs for the OAuth JWT Sign-in process.
 */
export function validateOAuthSignInInputs(
  user: NextAuthUser | AdapterUser,
  account: Account | null,
  correlationId: string,
  dependencies: {
    validateInputs: typeof validateSignInInputs;
    uuidv4: typeof defaultDependencies.uuidv4;
  }
): { isValid: boolean; errorToken?: JWT } {
  // Check for null account first
  if (!account) {
    logger.error({ correlationId }, 'Cannot process OAuth sign-in with null account');
    return { isValid: false, errorToken: { jti: dependencies.uuidv4() } }; // Return basic token with JTI
  }

  // Perform main validation
  const validationResult = dependencies.validateInputs(user, account, correlationId);

  // Check validation result
  if (!validationResult.isValid) {
    logger.error({ correlationId, provider: account.provider }, 'Failed JWT OAuth validation');
    return { isValid: false, errorToken: { jti: dependencies.uuidv4() } }; // Return basic token with JTI
  }

  // Inputs are valid
  return { isValid: true };
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
 * Attempts to find or create a database user for OAuth sign-in.
 * Returns the user if successful, or a fallback token if failed.
 */
export async function findOrCreateOAuthDbUserStep(params: {
  user: NextAuthUser | AdapterUser;
  account: Account;
  profile?: Profile;
  correlationId: string;
  baseToken: JWT; // Needed for fallback return
  dependencies: typeof defaultDependencies;
}): Promise<DbUserStepResult> {
  const { user, account, profile, correlationId, baseToken, dependencies } = params;

  // Try to find or create the database user
  const dbUser = await findOrCreateOAuthDbUser({
    user,
    account,
    profile,
    correlationId,
    dependencies,
  });

  // If database operation failed, prepare a fallback token
  if (!dbUser) {
    logger.warn(
      { correlationId, provider: account.provider },
      'DB user find/create failed, preparing fallback token.'
    );
    return {
      success: false,
      fallbackToken: { ...baseToken, jti: dependencies.uuidv4() },
    };
  }

  // Return the successful result
  return { success: true, dbUser };
}

/**
 * Creates a fallback JWT token for error cases
 */
export function createFallbackToken(baseToken: JWT, jtiGenerator: () => string): JWT {
  return { ...baseToken, jti: jtiGenerator() };
}

/**
 * Creates the final JWT payload after successful OAuth sign-in and DB user processing.
 */
export function createOAuthJwtPayload(params: {
  baseToken: JWT;
  dbUser: OAuthDbUser;
  provider: string;
  correlationId: string;
  dependencies: { uuidv4: typeof defaultDependencies.uuidv4 };
}): JWT {
  const { baseToken, dbUser, provider, correlationId, dependencies } = params;
  logger.info(
    { correlationId, userId: dbUser.userId, provider },
    'Successfully created JWT payload for OAuth sign-in'
  );
  return {
    ...baseToken,
    jti: dependencies.uuidv4(),
    sub: dbUser.userId,
    name: dbUser.name,
    email: dbUser.userEmail,
    picture: dbUser.image,
    role: dbUser.role,
    userId: dbUser.userId,
    userRole: dbUser.role,
  };
}

/**
 * Performs OAuth validation and returns a result object with success status and either
 * the validated account or a fallback token.
 */
export function validateOAuthRequestInputs(params: {
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  correlationId: string;
  baseToken: JWT;
  dependencies: {
    validateInputs: typeof validateSignInInputs;
    uuidv4: typeof defaultDependencies.uuidv4;
  };
}): {
  isValid: boolean;
  validAccount?: Account;
  fallbackToken?: JWT;
} {
  const { user, account, correlationId, baseToken, dependencies } = params;

  // Validate using the internal helper
  const validationResult = validateOAuthSignInInputs(user, account, correlationId, dependencies);

  // If validation failed, return the error token or a new fallback token
  if (!validationResult.isValid) {
    return {
      isValid: false,
      fallbackToken:
        validationResult.errorToken || createFallbackToken(baseToken, dependencies.uuidv4),
    };
  }

  // Validation succeeded, account is guaranteed non-null at this point
  return {
    isValid: true,
    validAccount: account as Account,
  };
}
