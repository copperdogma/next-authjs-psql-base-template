import { v4 as uuidv4 } from 'uuid';
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
} from './auth-helpers';

// ====================================
// JWT Helper Types/Interfaces
// ====================================

/**
 * Represents the structure of the arguments for the handleJwtSignIn function.
 */
export interface HandleJwtSignInArgs {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile;
  correlationId: string;
  dependencies: {
    findOrCreateUser: typeof findOrCreateUserAndAccountInternal;
    prepareProfile: typeof prepareProfileDataForDb;
    validateInputs: typeof validateSignInInputs;
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
async function _findOrCreateOAuthDbUser(
  options: FindOrCreateOptions
): Promise<AuthUserInternal | null> {
  const { userId, userEmail, profile, user, account, correlationId } = options; // Destructure inside

  const profileDataForDb = prepareProfileDataForDb(userId, userEmail, profile, user);

  const dbUser = await findOrCreateUserAndAccountInternal({
    email: userEmail,
    profileData: profileDataForDb,
    providerAccountId: account.providerAccountId,
    provider: account.provider,
    correlationId,
  });

  if (!dbUser) {
    logger.error({
      msg: 'Failed find/create user during OAuth sign-in',
      email: userEmail,
      provider: account.provider,
      correlationId,
    });
    return null;
  }
  return dbUser; // dbUser conforms to AuthUserInternal structure
}

// Helper to safely extract user role or default to USER
function _getUserRoleOrDefault(user: NextAuthUser | AdapterUser): UserRole {
  if (user && 'role' in user && typeof user.role === 'string') {
    // Basic validation if the role string is a valid UserRole enum value
    if (Object.values(UserRole).includes(user.role as UserRole)) {
      return user.role as UserRole;
    }
    logger.warn({
      msg: 'User object has invalid role property',
      userId: user.id,
      providedRole: user.role,
    });
  }
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
    return null;
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
    // return token; // DO NOT Return original token if user data was invalid
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

/**
 * Handles the JWT logic specifically for OAuth sign-ins.
 *
 * @param args - The arguments object containing token, user, account, profile, and correlationId.
 * @returns The updated JWT for an OAuth user.
 * @internal Used internally by handleJwtSignIn
 */
// eslint-disable-next-line max-statements -- Statement count is minimally over limit after significant refactoring.
const _handleJwtOAuthSignIn = async (args: HandleJwtSignInArgs): Promise<JWT> => {
  const { token, user, account, profile, correlationId, dependencies } = args;
  const { uuidv4 } = dependencies; // Only extract needed dependencies

  // Account cannot be null for OAuth flow, checked by the caller (handleJwtSignIn)
  if (!account) {
    logger.error({ msg: 'OAuth sign-in called without account object', correlationId });
    return token; // Or throw
  }

  // Step 1: Validate Input
  const validationResult = dependencies.validateInputs(user, account, correlationId);
  if (!validationResult.isValid) {
    return token; // Validation failed, return original token
  }

  // Add null checks
  const { userId, userEmail } = validationResult;
  if (!userId || !userEmail) {
    logger.error(
      { provider: account.provider, correlationId },
      'Validation passed but userId or userEmail missing'
    );
    return token;
  }

  logger.info({
    msg: 'OAuth sign-in processing in JWT callback',
    userId,
    provider: account.provider,
    correlationId,
  });

  // Step 2: Find/Create User in DB
  const dbUser = await _findOrCreateOAuthDbUser({
    userId,
    userEmail,
    profile,
    user,
    account,
    correlationId,
  });
  if (!dbUser) {
    return token; // DB operation failed, return original token
  }

  // Step 3: Build the updated token, including OAuth specific details
  const updatedToken: JWT = {
    ...token, // Preserve existing token properties
    sub: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    picture: dbUser.image,
    role: dbUser.role,
    jti: token.jti ?? uuidv4(), // Ensure JTI exists
    accessToken: account.access_token, // Include directly
    provider: account.provider, // Include directly
  };

  // Log additions (optional, could be removed if logs are too verbose)
  logger.debug(
    { correlationId, provider: account.provider },
    '[_handleJwtOAuthSignIn] Added access token and provider to token'
  );

  logger.debug(
    { correlationId, userId: updatedToken.sub, role: updatedToken.role },
    '[_handleJwtOAuthSignIn] Built OAuth token'
  );
  return updatedToken;
};

// Helper function to apply user updates from session to the token
function _applyUserUpdatesToToken(
  token: JWT,
  userUpdateData: Partial<AuthUserInternal>,
  correlationId: string
): JWT {
  logger.debug(
    { correlationId, updates: userUpdateData },
    '[_applyUserUpdatesToToken] Applying updates'
  );

  // Iterate over the provided user data and update the token
  for (const [key, value] of Object.entries(userUpdateData)) {
    // Ensure the key is a valid property of the JWT we want to update
    // (name, email, picture, role) - sub is handled separately
    if (key === 'name' || key === 'email' || key === 'picture' || key === 'role') {
      // Only update if the value is explicitly provided (not undefined/null)
      // Allow null for fields like 'name' or 'image' if that's intended
      if (value !== undefined) {
        token[key] = value; // Update the token field
        logger.debug(
          { correlationId, field: key },
          '[_applyUserUpdatesToToken] Updated token field'
        );
      }
    }
  }

  // Explicitly handle updating the 'sub' field if 'id' is provided in the update
  if (userUpdateData.id) {
    // Note: Typically, user ID (sub) should NOT change. Log a warning if it happens.
    if (token.sub !== userUpdateData.id) {
      logger.warn(
        { correlationId, oldSub: token.sub, newId: userUpdateData.id },
        "[_applyUserUpdatesToToken] Attempting to update user ID ('sub') in token. This is unusual and will be ignored."
      );
    }
    // DO NOT UPDATE token.sub - it should be immutable after initial sign-in
    // token.sub = userUpdateData.id; // Remove or comment out this line
    // logger.debug(
    //   { correlationId },
    //   '[_applyUserUpdatesToToken] Updated token sub (if id provided)'
    // );
  }

  return token;
}

// ====================================
// Public JWT Handling Functions
// ====================================

/**
 * Handles the JWT creation or update during sign-in or sign-up.
 * Differentiates between OAuth and Credentials sign-ins.
 *
 * @param args - The arguments object containing token, user, account, profile, and correlationId.
 * @returns The updated JWT.
 */
export async function handleJwtSignIn(args: HandleJwtSignInArgs): Promise<JWT> {
  const { token, user, account, correlationId } = args;

  // Handle Credentials Sign-In
  if (!account) {
    return _handleJwtCredentialsSignIn(token, user, correlationId);
  }

  // Handle OAuth Sign-In
  return await _handleJwtOAuthSignIn(args);
}

/**
 * Handles the logic for the JWT `session` callback (updating the token).
 */
export function handleJwtUpdate(
  token: JWT,
  session: Session, // Use the Session type which might contain user data for update
  correlationId: string,
  dependencies: { uuidv4: typeof uuidv4 } // Ensure correct type for uuidv4
): JWT {
  const { uuidv4 } = dependencies;

  const isUpdate = !!session?.user; // Check if session.user exists to signal an update intention
  logger.debug({ correlationId, isUpdate }, 'Processing JWT update callback');

  // Use injected uuidv4 to generate a new JTI *only* if an update is happening
  const newJti = isUpdate ? uuidv4() : (token.jti ?? uuidv4()); // Keep old JTI if no update, ensure one exists otherwise

  if (isUpdate && session.user) {
    logger.info({ correlationId }, 'Applying session user updates to JWT');
    // Apply updates using the helper function
    const updatedToken = _applyUserUpdatesToToken(
      { ...token }, // Pass a copy to avoid modifying the original token directly yet
      session.user as Partial<AuthUserInternal>, // Assume session.user structure matches AuthUserInternal partially
      correlationId
    );
    // Return the updated token with the *new* JTI
    return { ...updatedToken, jti: newJti };
  } else if (isUpdate) {
    // Handle the case where an update was intended (session provided) but session.user was empty/invalid
    logger.warn({ correlationId }, 'JWT update called with empty or invalid session user data.');
    // DEBUG: Log values just before returning
    // console.log('[handleJwtUpdate - Warning Path] Returning Token:', { ...token, jti: newJti });
    // console.log('[handleJwtUpdate - Warning Path] newJti value:', newJti);
    // console.log('[handleJwtUpdate - Warning Path] Original token.jti:', token.jti);
    // Still return a new JTI as an update was triggered
    return { ...token, jti: newJti };
  }

  // This path is for token refresh or when the session callback is triggered without update intent
  logger.debug({ correlationId }, 'JWT update callback: No update data provided, returning token.');
  // Ensure JTI exists, but don't generate a new one unless necessary
  return { ...token, jti: token.jti ?? newJti }; // Use newJti only if original token.jti was missing
}
