import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import { prepareProfileDataForDb, type AuthUserInternal } from './auth-helpers';
import { defaultDependencies, type OAuthDbUser } from './auth-jwt-types';
import { validateOAuthInputs } from './oauth-validation-helpers';

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

  // Create OAuth token with required structure to match test expectations
  // Return only the expected fields without the 'provider' field
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

/**
 * Handles OAuth sign-in process.
 * This function validates the OAuth inputs and returns success/failure.
 */
export async function handleOAuthSignIn(params: {
  user: NextAuthUser | AdapterUser;
  account: Account;
  profile: Profile;
  isNewUser?: boolean;
  correlationId?: string;
  dependencies?: Partial<typeof defaultDependencies>;
}): Promise<boolean> {
  const {
    user,
    account,
    profile,
    correlationId: providedCorrelationId,
    dependencies = {},
  } = params;
  const localDeps = { ...defaultDependencies, ...dependencies };
  const correlationId = providedCorrelationId || localDeps.uuidv4();

  // Validate inputs
  const validationResult = localDeps.validateInputs(user, account, correlationId);

  if (!validationResult.isValid) {
    logger.warn({ correlationId, provider: account.provider }, 'OAuth sign-in validation failed');
    return false;
  }

  // Find or create user in DB
  const dbUser = await findOrCreateOAuthDbUser({
    user,
    account,
    profile,
    correlationId,
    dependencies: {
      findOrCreateUser: localDeps.findOrCreateUser,
      prepareProfile: localDeps.prepareProfile,
      uuidv4: localDeps.uuidv4,
      validateInputs: localDeps.validateInputs,
    },
  });

  if (!dbUser) {
    logger.error(
      { correlationId, provider: account.provider },
      'Failed to find or create OAuth user in DB during sign-in'
    );
    return false;
  }

  // Log successful validation and DB processing
  logger.info(
    { correlationId, userId: dbUser.userId, provider: account.provider },
    'OAuth sign-in successful and user processed in DB'
  );
  return true;
}

/**
 * Processes the OAuth user data, interacts with the database, and creates a JWT.
 * This is a helper function for the OAuth sign-in callback.
 */
async function processOauthUserAndCreateJwt(params: {
  user: NextAuthUser | AdapterUser;
  account: Account; // Account is guaranteed non-null by the caller
  profile?: Profile;
  correlationId: string;
  localDeps: typeof defaultDependencies & Partial<typeof defaultDependencies>; // Combined type
  baseJwt: JWT; // The original JWT to spread if successful
}): Promise<JWT> {
  const { user, account, profile, correlationId, localDeps, baseJwt } = params;

  // Proceed to find or create user
  const dbUser = await findOrCreateOAuthDbUser({
    user,
    account,
    profile,
    correlationId,
    dependencies: {
      findOrCreateUser: localDeps.findOrCreateUser,
      prepareProfile: localDeps.prepareProfile,
      uuidv4: localDeps.uuidv4,
      validateInputs: localDeps.validateInputs, // Though not directly used here, keep for consistency if findOrCreateOAuthDbUser evolves
    },
  });

  if (!dbUser) {
    logger.error(
      { correlationId, provider: account.provider },
      'OAuth callback failed to get DB user'
    );
    return { jti: localDeps.uuidv4(), id: 'unknown', role: UserRole.USER }; // Minimal token on DB error
  }

  // Successfully processed, create new JWT payload
  logger.info({
    correlationId,
    userId: dbUser.userId,
    provider: account.provider,
    msg: 'OAuth callback successful, creating new JWT payload',
  });

  return {
    ...baseJwt,
    sub: dbUser.userId,
    id: dbUser.userId,
    name: dbUser.name,
    email: dbUser.userEmail,
    picture: dbUser.image,
    role: dbUser.role || UserRole.USER,
    jti: localDeps.uuidv4(),
    userId: dbUser.userId,
    userRole: dbUser.role || UserRole.USER,
  };
}

/**
 * Creates an OAuth sign-in callback that returns a function for the OAuth flow.
 */
export function createOAuthSignInCallback(params: {
  jwt: JWT;
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile;
  correlationId?: string;
  dependencies?: Partial<typeof defaultDependencies>;
}): () => Promise<JWT> {
  const {
    jwt,
    token,
    user,
    account,
    profile,
    correlationId: providedCorrelationId,
    dependencies = {},
  } = params;
  const localDeps = { ...defaultDependencies, ...dependencies };
  const callbackExecutionCorrelationId = providedCorrelationId || localDeps.uuidv4();

  return async (): Promise<JWT> => {
    try {
      if (!account) {
        logger.warn(
          { correlationId: callbackExecutionCorrelationId },
          'OAuth callback received null account, returning original token'
        );
        return token; // Return original token if account is null
      }
      const validationResult = localDeps.validateInputs(
        user,
        account,
        callbackExecutionCorrelationId
      );
      if (!validationResult.isValid) {
        logger.warn(
          { correlationId: callbackExecutionCorrelationId, provider: account.provider },
          'OAuth callback validation failed'
        );
        return { jti: localDeps.uuidv4(), id: 'unknown', role: UserRole.USER }; // Minimal token on validation failure
      }
      return await processOauthUserAndCreateJwt({
        user,
        account, // account is now guaranteed non-null here
        profile,
        correlationId: callbackExecutionCorrelationId,
        localDeps,
        baseJwt: jwt, // Pass the JWT to be enriched
      });
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          correlationId: callbackExecutionCorrelationId,
        },
        'Error in OAuth sign-in callback'
      );
      return { jti: localDeps.uuidv4(), id: 'unknown', role: UserRole.USER }; // Minimal token on catch
    }
  };
}
