import { v4 as uuidv4, type v4 as UuidV4Type } from 'uuid';
import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type Session, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger'; // Use Alias
import { UserRole } from '@/types'; // Import UserRole from custom types
import {
  findOrCreateUserAndAccountInternal,
  prepareProfileDataForDb,
  validateSignInInputs,
  type AuthUserInternal,
  type FindOrCreateUserParams,
  type ValidateSignInResult,
} from './auth-helpers';

// ====================================
// JWT Helper Types/Interfaces
// ====================================

// Define base JWT input/output types
export type JwtInput = JWT;
export type JwtOutput = JWT;

// Define a generic type for JWT callbacks
export type AuthJwtCallback<TArgs, TReturn> = (args: TArgs) => Promise<TReturn>;

/**
 * Represents the structure of the arguments for the handleJwtSignIn function.
 */
export interface HandleJwtSignInArgs {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile;
  correlationId: string;
  dependencies?: {
    findOrCreateUser: typeof findOrCreateUserAndAccountInternal;
    prepareProfile: typeof prepareProfileDataForDb;
    validateInputs: typeof validateSignInInputs;
    uuidv4: typeof uuidv4;
  };
}

// Define a type for the JWT update arguments
export interface HandleJwtUpdateArgs {
  token: JWT;
  session: Session;
  correlationId: string;
  dependencies?: {
    uuidv4: typeof uuidv4;
  };
}

// ====================================
// Internal Helper Functions for JWT
// ====================================

// Helper function to find or create user during OAuth sign-in
// Consolidate parameters into an options object
interface FindOrCreateOptions {
  userId: string;
  userEmail: string;
  profile: Profile | undefined;
  user: NextAuthUser | AdapterUser;
  account: Account;
  correlationId: string;
}

/**
 * Helper function to find or create a user in the database from OAuth data.
 */
async function _findOrCreateOAuthDbUser(
  params: {
    user: NextAuthUser | AdapterUser,
    account: Account,
    profile?: Profile,
    correlationId: string,
    dependencies?: typeof defaultDependencies
  }
): Promise<{
  userId: string,
  userEmail: string,
  name?: string | null,
  image?: string | null,
  role?: UserRole | null
} | null> {
  const { user, account, profile, correlationId, dependencies } = params;
  const deps = dependencies || defaultDependencies;

  try {
    // Prepare the profile data for database storage
    const preparedProfile = profile ? deps.prepareProfile(profile, account.provider) : {};

    // Try to find or create the user
    const dbUser = await deps.findOrCreateUser({
      userId: user.id,
      email: user.email || '',
      name: user.name,
      image: user.image,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      profile: preparedProfile,
    });

    if (!dbUser || !dbUser.id || !dbUser.email) {
      logger.error(
        { correlationId, provider: account.provider },
        'Failed to find or create user during OAuth sign-in'
      );
      return null;
    }

    return {
      userId: dbUser.id,
      userEmail: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
    };
  } catch (error) {
    logger.error(
      {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        provider: account.provider
      },
      'Error finding or creating user during OAuth sign-in'
    );
    return null;
  }
}

// Helper to safely extract user role or default to USER
function _getUserRoleOrDefault(user: NextAuthUser | AdapterUser): UserRole {
  // Check if user exists and has a role property that is a string
  if (user && typeof user.role === 'string') {
    // Check if the role string is a valid value in the UserRole enum
    if (Object.values(UserRole).includes(user.role as UserRole)) {
      return user.role as UserRole;
    }
    // Log warning if the role is present but invalid
    logger.warn({
      msg: 'User object has invalid role property, defaulting to USER.',
      userId: user.id,
      providedRole: user.role,
    });
  }
  // Default to USER if role is missing, not a string, or invalid
  return UserRole.USER;
}

// Helper to build AuthUserInternal from NextAuth user object
function _buildAuthUserInternalFromCredentials(
  user: NextAuthUser | AdapterUser,
  correlationId: string // Pass correlationId for logging if needed
): AuthUserInternal | null {
  if (!user?.id || !user?.email) {
    logger.error({
      msg: 'User object missing required fields for building AuthUserInternal',
      userId: user?.id,
      email: user?.email,
      correlationId, // Log context
    });
    return null; // Return null to indicate failure
  }

  const role = _getUserRoleOrDefault(user);

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    image: user.image ?? null,
    role: role,
  };
}

/**
 * Handles the JWT logic specifically for Credentials sign-ins.
 *
 * @param token The current JWT.
 * @param user The user object from the database.
 * @param correlationId A unique ID for tracing the request.
 * @returns The updated JWT for a credentials user.
 * @internal Used internally by handleJwtSignIn
 */
const _handleJwtCredentialsSignIn = (
  token: JWT,
  user: NextAuthUser | AdapterUser,
  correlationId: string
): JWT => {
  logger.info({
    msg: 'Credentials sign-in detected in JWT callback',
    userId: user.id,
    correlationId,
  });

  const authUser = _buildAuthUserInternalFromCredentials(user, correlationId);

  if (!authUser) {
    // Error already logged in helper function
    // If this helper returns null, the sign-in fails here.
    // Throw an error instead of returning the original token.
    logger.error(
      { correlationId, userId: user?.id },
      'Failed to build internal auth user for JWT during credentials sign-in.'
    );
    throw new Error('Could not prepare user data for session token during credentials sign-in.');
  }

  // Directly update the token with AuthUserInternal data
  token.sub = authUser.id;
  token.name = authUser.name;
  token.email = authUser.email;
  token.picture = authUser.image;
  token.role = authUser.role;
  token.jti = token.jti ?? uuidv4(); // Ensure JTI exists

  return token;
};

// --- Helper Functions for _handleJwtOAuthSignIn ---

// Helper to validate inputs specific to OAuth flow
function _validateOAuthInputs(
  user: NextAuthUser | AdapterUser,
  account: Account | null,
  correlationId: string,
  validateInputsDependency: typeof validateSignInInputs
): { isValid: true; userId: string; userEmail: string } | { isValid: false } {
  if (!account) {
    logger.error({ msg: 'OAuth sign-in called without account object', correlationId });
    return { isValid: false };
  }

  const validationResult = validateInputsDependency(user, account, correlationId);
  if (!validationResult.isValid) {
    return { isValid: false };
  }

  const { userId, userEmail } = validationResult;
  if (!userId || !userEmail) {
    logger.error(
      { provider: account.provider, correlationId },
      'Validation passed but userId or userEmail missing'
    );
    return { isValid: false };
  }

  return { isValid: true, userId, userEmail };
}

// Helper to build the final JWT for OAuth flow
function _buildOAuthJwt(
  token: JWT,
  dbUser: AuthUserInternal,
  account: Account,
  uuidv4: typeof import('uuid').v4 // Use correct type
): JWT {
  const updatedToken: JWT = {
    ...token,
    sub: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    picture: dbUser.image,
    role: dbUser.role,
    jti: token.jti ?? uuidv4(),
    accessToken: account.access_token,
    provider: account.provider,
  };
  // Optional: Add logging if desired
  logger.debug(
    { userId: updatedToken.sub, role: updatedToken.role, provider: updatedToken.provider },
    '[_buildOAuthJwt] Built OAuth token'
  );
  return updatedToken;
}

// Default dependencies to use when none are provided
const defaultDependencies = {
  findOrCreateUser: findOrCreateUserAndAccountInternal,
  prepareProfile: prepareProfileDataForDb,
  validateInputs: validateSignInInputs,
  uuidv4: uuidv4
};

/**
 * Handles the logic for the JWT `callback` (sign-in).
 */
export const handleJwtSignIn: AuthJwtCallback<HandleJwtSignInArgs, JwtInput> = async (
  args,
): Promise<JwtInput> => {
  const { token, user, account, profile, correlationId } = args;
  const deps = args.dependencies || defaultDependencies;
  const sharedLogData = { correlationId };

  // Always generate a JTI for the session start
  const jti = deps.uuidv4();
  const tokenWithJti = { ...token, jti };

  try {
    // OAuth Sign-in Path
    if (account && profile && user) {
      logger.debug({ ...sharedLogData, provider: account.provider }, 'Starting OAuth JWT Sign-in');
      return await _handleJwtOAuthSignIn({ ...args, dependencies: deps });
    }

    // Credentials Sign-in Path (or fallback if OAuth args missing)
    logger.debug(sharedLogData, 'Starting Credentials JWT Sign-in');
    const credentialsUser = _buildAuthUserInternalFromCredentials(
      user,
      correlationId
    );

    if (!credentialsUser) {
      logger.error(
        { ...sharedLogData, userId: user?.id },
        'Failed to build internal auth user for JWT during credentials sign-in.'
      );
      throw new Error('Could not prepare user data for session token during credentials sign-in.');
    }

    logger.info(
      { ...sharedLogData, userId: credentialsUser.id },
      'Successfully created JWT for credentials sign-in'
    );

    return {
      ...tokenWithJti,
      sub: credentialsUser.id,
      name: credentialsUser.name,
      email: credentialsUser.email,
      picture: credentialsUser.image,
      role: credentialsUser.role,
      userId: credentialsUser.id,
      userRole: credentialsUser.role,
    };
  } catch (error) {
    logger.error(
      { ...sharedLogData, error: (error as Error).message },
      'Error creating JWT during sign-in'
    );

    // On error, at least return the base token with JTI
    return tokenWithJti;
  }
};

/**
 * Handle OAuth sign-in flow for JWT creation.
 */
const _handleJwtOAuthSignIn = async (args: HandleJwtSignInArgs): Promise<JWT> => {
  const { token, user, account, profile, correlationId, dependencies } = args;
  const deps = dependencies || defaultDependencies;

  // Step 1: Validate Input using helper
  // Early return if account is null
  if (!account) {
    logger.error({ correlationId }, 'Cannot process OAuth sign-in with null account');
    return { ...token, jti: deps.uuidv4() };
  }

  const validationResult = deps.validateInputs(user, account, correlationId);

  // If validation fails, log and return base token
  if (!validationResult.isValid) {
    logger.error(
      { correlationId, provider: account.provider },
      'Failed JWT OAuth validation'
    );
    return { ...token, jti: deps.uuidv4() };
  }

  // Step 2: Try to find or create a DB user
  // Type for the expected DB user result
  type DbUserResult = {
    userId: string;
    userEmail: string;
    name?: string | null;
    image?: string | null;
    role?: UserRole | null;
  };

  const dbUser = await _findOrCreateOAuthDbUser({
    user,
    account,
    profile,
    correlationId,
    dependencies: deps
  }) as DbUserResult | null;

  // If DB user creation failed, return basic token
  if (!dbUser) {
    return { ...token, jti: deps.uuidv4() };
  }

  // Step 3: Create an enhanced token with user data
  logger.info(
    { correlationId, userId: dbUser.userId, provider: account.provider },
    'Successfully created JWT for OAuth sign-in'
  );

  return {
    ...token,
    jti: deps.uuidv4(),
    sub: dbUser.userId,
    name: dbUser.name,
    email: dbUser.userEmail,
    picture: dbUser.image,
    role: dbUser.role,
    userId: dbUser.userId,
    userRole: dbUser.role,
  };
};

// Helper function to apply user updates from session to the token
function _applyUserUpdatesToToken(
  token: JWT,
  userUpdateData: Partial<AuthUserInternal>,
  correlationId: string,
  uuidv4: typeof UuidV4Type
): JWT {
  const updatedToken = { ...token }; // Clone the token

  let updated = false;
  if (userUpdateData.name !== undefined && userUpdateData.name !== token.name) {
    updatedToken.name = userUpdateData.name;
    updated = true;
  }
  if (userUpdateData.email !== undefined && userUpdateData.email !== token.email) {
    updatedToken.email = userUpdateData.email;
    updated = true;
  }
  // Add handling for picture/image
  if (userUpdateData.image !== undefined && userUpdateData.image !== token.picture) {
    updatedToken.picture = userUpdateData.image;
    updated = true;
  }

  // Handle role update using the helper function
  const newRole = _getUserRoleOrDefault(userUpdateData as AdapterUser); // Cast needed? Check type
  if (newRole !== token.role) {
    updatedToken.role = newRole;
    updated = true;
  }

  // Only generate a new JTI if actual changes were made
  if (updated) {
    updatedToken.jti = uuidv4(); // Use the passed dependency
    logger.debug(
      { correlationId },
      '[_applyUserUpdatesToToken] Applied updates and generated new JTI'
    );
  } else {
    logger.debug(
      { correlationId },
      '[_applyUserUpdatesToToken] No effective updates applied, JTI unchanged'
    );
  }

  return updatedToken;
}

// ====================================
// Public JWT Handling Functions
// ====================================

/**
 * Handles the logic for the JWT `session` callback (updating the token).
 */
export function handleJwtUpdate(
  token: JWT,
  session: Session,
  correlationId: string,
  dependencies?: { uuidv4: typeof uuidv4 }
): JWT {
  const deps = dependencies || { uuidv4 };
  logger.debug({ correlationId }, '[handleJwtUpdate] Function start');

  // Check if there's actual user data to update from
  if (!session?.user || Object.keys(session.user).length === 0) {
    logger.warn(
      { correlationId, hasSession: !!session, hasUser: !!session?.user },
      '[handleJwtUpdate] Session update triggered but no user data found in session. Returning original token.'
    );
    return token;
  }

  // Check session.user data for updates needed
  // For now, just ensure JTI exists - can extend later
  if (!token.jti) {
    token.jti = deps.uuidv4();
    logger.debug({ correlationId, jti: token.jti }, '[handleJwtUpdate] Added missing JTI to token');
  }

  return token;
}