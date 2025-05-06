import { type JWT } from 'next-auth/jwt';
import { type Account, type Session } from 'next-auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

import {
  defaultDependencies,
  type JwtInput,
  type JwtOutput,
  type HandleJwtSignInArgs,
  type AuthJwtCallback,
} from './auth-jwt-types';

import {
  buildAuthUserInternalFromCredentials,
  validateOAuthRequestInputs,
  findOrCreateOAuthDbUserStep,
  createOAuthJwtPayload,
  updateTokenFieldsFromSession,
  createFallbackToken,
} from './auth-jwt-helpers';

/**
 * Handle OAuth sign-in flow for JWT creation.
 */
const _handleJwtOAuthSignIn = async (args: HandleJwtSignInArgs): Promise<JWT> => {
  const { token, user, account, profile, correlationId, dependencies } = args;
  const deps = dependencies || defaultDependencies;

  // Step 1: Validate inputs with the integrated validation helper
  const validationResult = validateOAuthRequestInputs({
    user,
    account,
    correlationId,
    baseToken: token,
    dependencies: { validateInputs: deps.validateInputs, uuidv4: deps.uuidv4 },
  });

  if (!validationResult.isValid) {
    return validationResult.fallbackToken || createFallbackToken(token, deps.uuidv4);
  }

  // Use optional chaining instead of non-null assertion
  const validAccount = validationResult.validAccount;

  // Step 2: Find or create DB user with validated account
  const dbStepResult = await findOrCreateOAuthDbUserStep({
    user,
    account: validAccount as Account, // Type assertion is safe because we checked isValid
    profile,
    correlationId,
    baseToken: token,
    dependencies: deps,
  });

  // Return fallback token if DB user step failed
  if (!dbStepResult.success || !dbStepResult.dbUser) {
    return dbStepResult.fallbackToken || createFallbackToken(token, deps.uuidv4);
  }

  // Step 3: Create JWT payload with successful DB user
  return createOAuthJwtPayload({
    baseToken: token,
    dbUser: dbStepResult.dbUser,
    provider: validAccount?.provider || 'unknown', // Use optional chaining with fallback
    correlationId,
    dependencies: { uuidv4: deps.uuidv4 },
  });
};

/**
 * Handles the logic for the JWT `callback` (sign-in).
 */
export const handleJwtSignIn: AuthJwtCallback<HandleJwtSignInArgs, JwtInput> = async (
  args
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
    const credentialsUser = buildAuthUserInternalFromCredentials(user, correlationId);

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
 * Handles the logic for the JWT `session` callback (updating the token).
 */
export function handleJwtUpdate(
  token: JWT,
  session: Session,
  correlationId: string,
  dependencies: { uuidv4: typeof uuidv4 }
): JwtOutput {
  const deps = dependencies; // Use provided dependencies
  logger.debug(
    { correlationId, tokenId: token.jti },
    '[handleJwtUpdate] Updating JWT based on session'
  );

  // Validate session and user data
  if (!session?.user || Object.keys(session.user).length === 0) {
    logger.warn(
      { correlationId, tokenId: token.jti, hasSession: !!session, hasUser: !!session?.user },
      'Session or session.user is empty/missing. Returning original token.'
    );
    return token as JwtOutput; // Return original token if no user data in session
  }

  // Generate a new JTI for the updated token, indicating a refresh
  const newJti = deps.uuidv4();
  let updatedToken = { ...token, jti: newJti };

  try {
    // Use the helper function to update fields
    // We know the helper might return a JWT with undefined jti, but the overall function expects JwtOutput
    const potentiallyUpdatedToken = updateTokenFieldsFromSession(updatedToken, session.user);

    logger.debug(
      { correlationId, userId: potentiallyUpdatedToken.sub, newTokenId: newJti },
      'JWT updated successfully from session data.'
    );
    // Assert the final type matches the expected output, ensuring jti compatibility implicitly
    return potentiallyUpdatedToken as JwtOutput;
  } catch (error) {
    logger.error(
      {
        correlationId,
        tokenId: token.jti,
        userId: token.sub,
        error: error instanceof Error ? error.message : String(error),
      },
      'Error updating JWT from session data. Returning original token.'
    );
    // In case of error during update, return the original token but ensure JTI exists
    // Use the new JTI generated before the try block if the original token lacks one.
    const jtiValue = token.jti || newJti; // Guaranteed to be a string
    return { ...token, jti: jtiValue } as JwtOutput; // Use type assertion
  }
}
