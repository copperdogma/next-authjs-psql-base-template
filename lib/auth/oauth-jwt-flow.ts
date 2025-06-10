/**
 * @file oauth-jwt-flow.ts
 *
 * This file consolidates the OAuth JWT authentication flow to make it more cohesive and easier to follow.
 * It brings together the key functions from oauth-helpers.ts, auth-jwt-helpers.ts, and oauth-validation-helpers.ts
 * that form the OAuth-to-JWT pipeline.
 */

import { type JWT } from 'next-auth/jwt';
import { type Account, type Profile, type User as NextAuthUser } from 'next-auth';
import { type AdapterUser } from 'next-auth/adapters';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import { prepareProfileDataForDb, type AuthUserInternal } from './auth-helpers';
import { defaultDependencies, type OAuthDbUser, type DbUserStepResult } from './auth-jwt-types';
import { validateSignInInputs } from './auth-helpers';

/**
 * Core function for the OAuth JWT flow.
 * Handles the entire process from validation to JWT creation.
 */
export async function handleOAuthJwtSignIn(args: {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile;
  correlationId: string;
  dependencies?: typeof defaultDependencies;
}): Promise<JWT> {
  const { token, user, account, profile, correlationId, dependencies } = args;
  const deps = dependencies || defaultDependencies;

  // Step 1: Validate inputs
  const validationResult = validateOAuthRequestInputs({
    user,
    account,
    correlationId,
    _baseToken: token,
    dependencies: {
      validateInputs: deps.validateInputs,
      uuidv4: deps.uuidv4,
    },
  });

  if (!validationResult.isValid) {
    return validationResult.fallbackToken || createFallbackToken(token, deps.uuidv4);
  }

  const validAccount = validationResult.validAccount;

  // Step 2: Find or create user in database
  const dbStepResult = await findOrCreateOAuthDbUserStep({
    user,
    account: validAccount as Account, // Type assertion is safe because we checked isValid
    profile,
    correlationId,
    _baseToken: token,
    dependencies: deps,
  });

  // Return fallback token if DB user step failed
  if (!dbStepResult.success || !dbStepResult.dbUser) {
    return dbStepResult.fallbackToken || createFallbackToken(token, deps.uuidv4);
  }

  // Step 3: Create JWT payload with successful DB user
  return createOAuthJwtPayload({
    _baseToken: token,
    dbUser: dbStepResult.dbUser,
    provider: validAccount?.provider || 'unknown',
    correlationId,
    dependencies: { uuidv4: deps.uuidv4 },
  });
}

/**
 * Validates OAuth request inputs and returns validation result.
 */
export function validateOAuthRequestInputs(params: {
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  correlationId: string;
  _baseToken: JWT;
  dependencies: {
    validateInputs: typeof validateSignInInputs;
    uuidv4: typeof defaultDependencies.uuidv4;
  };
}): {
  isValid: boolean;
  validAccount?: Account;
  fallbackToken?: JWT;
} {
  const { user, account, correlationId, _baseToken, dependencies } = params;

  // Check for null account
  if (!account) {
    logger.error({ correlationId }, 'Cannot process OAuth sign-in with null account');
    return {
      isValid: false,
      fallbackToken: createFallbackToken(_baseToken, dependencies.uuidv4),
    };
  }

  // Perform main validation
  const validationResult = dependencies.validateInputs(user, account, correlationId);

  // Check validation result
  if (!validationResult.isValid) {
    logger.error({ correlationId, provider: account.provider }, 'Failed JWT OAuth validation');
    return {
      isValid: false,
      fallbackToken: createFallbackToken(_baseToken, dependencies.uuidv4),
    };
  }

  // Inputs are valid
  return { isValid: true, validAccount: account };
}

/**
 * Creates a fallback token when OAuth authentication fails.
 */
export function createFallbackToken(_baseToken: JWT, jtiGenerator: () => string): JWT {
  // For failed OAuth, return just a minimal token with new JTI
  return { jti: jtiGenerator(), id: 'unknown', role: UserRole.USER };
}

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
 * Finds or creates a user in the database from OAuth data and prepares the result.
 */
export async function findOrCreateOAuthDbUserStep(params: {
  user: NextAuthUser | AdapterUser;
  account: Account;
  profile?: Profile;
  correlationId: string;
  _baseToken: JWT;
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
 * Creates the JWT payload for an OAuth authentication.
 */
export function createOAuthJwtPayload(params: {
  _baseToken: JWT;
  dbUser: OAuthDbUser;
  provider: string;
  correlationId: string;
  dependencies: { uuidv4: typeof defaultDependencies.uuidv4 };
}): JWT {
  const { dbUser, provider, correlationId, dependencies } = params;

  // Log successful OAuth JWT creation
  logger.info({
    correlationId,
    userId: dbUser.userId,
    provider,
    msg: 'Creating OAuth JWT payload',
  });

  // Create OAuth token with required structure
  return {
    sub: dbUser.userId,
    id: dbUser.userId,
    name: dbUser.name,
    email: dbUser.userEmail,
    picture: dbUser.image,
    role: dbUser.role || UserRole.USER,
    jti: dependencies.uuidv4(),
    userId: dbUser.userId,
    userRole: dbUser.role || UserRole.USER,
  };
}
