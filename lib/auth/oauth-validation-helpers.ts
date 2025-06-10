import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
import { type JWT } from 'next-auth/jwt';
import { defaultDependencies } from './auth-jwt-types';
import { validateSignInInputs } from './auth-helpers';

// Note: AuthUserInternal, defaultDependencies, validateSignInInputs, JWT, createFallbackToken
// might be needed here if other validation functions are moved.

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
    return {
      isValid: false,
      errorToken: { jti: dependencies.uuidv4(), id: 'unknown', role: 'USER' },
    }; // Return basic token with JTI
  }

  // Perform main validation
  const validationResult = dependencies.validateInputs(user, account, correlationId);

  // Check validation result
  if (!validationResult.isValid) {
    logger.error({ correlationId, provider: account.provider }, 'Failed JWT OAuth validation');
    return {
      isValid: false,
      errorToken: { jti: dependencies.uuidv4(), id: 'unknown', role: 'USER' },
    }; // Return basic token with JTI
  }

  // Inputs are valid
  return { isValid: true };
}

/**
 * Creates a fallback token when OAuth authentication fails.
 */
export function createFallbackToken(_baseToken: JWT, jtiGenerator: () => string): JWT {
  // For failed OAuth, return just a minimal token with new JTI
  return { jti: jtiGenerator(), id: 'unknown', role: 'USER' };
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
