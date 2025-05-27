import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import { prepareProfileDataForDb, type AuthUserInternal } from './auth-helpers';
import { defaultDependencies, type OAuthDbUser } from './auth-jwt-types';
import { validateOAuthInputs } from './oauth-validation-helpers';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
    return { jti: localDeps.uuidv4() }; // Minimal token on DB error
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
        return { jti: localDeps.uuidv4() }; // Minimal token on validation failure
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
      return { jti: localDeps.uuidv4() }; // Minimal token on catch
    }
  };
}

// Define missing types
type OAuthUserProfile = {
  id: string;
  email?: string;
  name?: string | null;
  image?: string | null;
};

type OAuthAccount = {
  provider: string;
  providerAccountId: string;
  type: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
};

type CreateOrUpdateOAuthUserOptions = {
  services?: {
    logger?: typeof logger;
    db?: typeof prisma;
  };
};

// Ensure actionLogger is imported or defined
const actionLogger = logger;

export async function createOrUpdateOAuthUser(
  profile: OAuthUserProfile,
  account: OAuthAccount,
  options?: CreateOrUpdateOAuthUserOptions
): Promise<OAuthDbUser & { isNewUser?: boolean }> {
  const { logger: _logger, db: _db } = options?.services || {};
  const log = _logger || actionLogger.child({ function: 'createOrUpdateOAuthUser' });
  const prismaDb = _db || prisma; // Use provided db or global prisma

  const email = profile.email;
  if (!email) {
    log.error(
      { profileId: profile.id, provider: account.provider },
      'Email missing from OAuth profile'
    );
    throw new Error('Email is required from OAuth provider.');
  }

  const logContext = {
    email,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
  };

  return prismaDb.$transaction(
    async tx => {
      let existingAccount = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      });

      let appUser: OAuthDbUser;
      let isNewUser = false;

      if (existingAccount?.user) {
        log.info(logContext, 'OAuth account and user found. Potentially updating user profile.');
        appUser = {
          userId: existingAccount.user.id,
          userEmail: existingAccount.user.email as string, // Should always have email
          name: existingAccount.user.name,
          image: existingAccount.user.image,
          role: existingAccount.user.role as UserRole,
        };
        // Optionally update user.name/image from profile if changed
        // This part needs careful consideration of data freshness and override logic
        const updates: Partial<PrismaUser> = {};
        if (profile.name && profile.name !== appUser.name) updates.name = profile.name;
        if (profile.image && profile.image !== appUser.image) updates.image = profile.image;
        if (Object.keys(updates).length > 0) {
          const updatedPrismaUser = await tx.user.update({
            where: { id: appUser.userId },
            data: updates,
          });
          appUser.name = updatedPrismaUser.name;
          appUser.image = updatedPrismaUser.image;
        }
      } else {
        log.info(
          logContext,
          'OAuth account not found or user not linked. Creating or linking user.'
        );
        // Try to find user by email, otherwise create new user
        let existingUserByEmail = await tx.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
          log.info(
            { ...logContext, userId: existingUserByEmail.id },
            'User found by email. Linking account.'
          );
        } else {
          isNewUser = true;
          log.info(logContext, 'No existing user found by email. Creating new user.');
          const newUserFields: Prisma.UserCreateInput = {
            email,
            name: profile.name,
            image: profile.image,
            emailVerified: new Date(), // Assume email is verified by OAuth provider
            role: UserRole.USER, // Default role
          };
          existingUserByEmail = await tx.user.create({ data: newUserFields });
          log.info({ ...logContext, userId: existingUserByEmail.id }, 'New user created.');
        }

        appUser = {
          userId: existingUserByEmail.id,
          userEmail: existingUserByEmail.email as string,
          name: existingUserByEmail.name,
          image: existingUserByEmail.image,
          role: existingUserByEmail.role as UserRole,
        };

        // Create the account and link it to the user
        await tx.account.create({
          data: {
            userId: appUser.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });
        log.info(
          { ...logContext, userId: appUser.userId },
          'OAuth account created and linked to user.'
        );
      }
      // The user object (appUser) here is of type OAuthDbUser.
      // We add isNewUser to it for the return value.
      return { ...appUser, isNewUser };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable } // Or appropriate level
  );
}
