import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import type { User as NextAuthUser } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { Profile } from 'next-auth';
import { isObject as _isObject } from '../utils/type-guards';
import type { Logger } from 'pino';

// ====================================
// Interfaces (Copied from auth-node.ts)
// ====================================

// Define interface for our custom AuthUser structure used internally (mapping from DB)
export interface AuthUserInternal {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// Interface for parameters for _createNewUserWithAccount
interface CreateNewUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  provider: string;
  providerAccountId: string;
  correlationId: string;
}

// Type for user data passed to _handleExistingUser
interface ExistingUserWithAccountsFromDB {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string; // Prisma role is a string, will be cast to UserRole
  accounts: { provider: string; providerAccountId: string }[];
}

// Define interface for parameters used in findOrCreateUserAndAccountInternal
export interface FindOrCreateUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  providerAccountId: string;
  provider: string;
  correlationId: string;
}

// Type for the arguments object for handleJwtSignIn result
export interface ValidateSignInResult {
  isValid: boolean;
  userId?: string | null;
  userEmail?: string | null;
}

// ====================================
// Helper Functions (Moved from auth-node.ts)
// ====================================

// --- User/Account Management ---

// Creates an account for an existing user
async function _createAccountForExistingUser(
  userId: string,
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<void> {
  logger.info(
    { userId, provider, correlationId },
    '[_createAccountForExistingUser] Adding new provider account'
  );
  try {
    await prisma.account.create({
      data: {
        userId: userId,
        type: 'oauth', // Assuming OAuth
        provider: provider,
        providerAccountId: providerAccountId,
      },
    });
  } catch (error) {
    logger.error(
      { err: error, userId, provider, correlationId },
      '[_createAccountForExistingUser] Failed to add account'
    );
    throw error;
  }
}

// Creates a new user and account, returns structure needed for AuthUserInternal or null
async function _createNewUserWithAccount(
  params: CreateNewUserParams
): Promise<(Omit<AuthUserInternal, 'role'> & { role: UserRole }) | null> {
  const { email, profileData, provider, providerAccountId, correlationId } = params;
  logger.info(
    { email, provider, correlationId },
    '[_createNewUserWithAccount] Creating new user and account'
  );
  try {
    const newUser = await prisma.user.create({
      data: {
        id: profileData.id,
        email: email,
        name: profileData.name,
        image: profileData.image,
        role: 'USER', // Use string literal as expected by Prisma schema
        accounts: {
          create: {
            type: 'oauth',
            provider: provider,
            providerAccountId: providerAccountId,
          },
        },
      },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    logger.info(
      { userId: newUser.id, correlationId },
      '[_createNewUserWithAccount] New user and account created successfully'
    );
    return { ...newUser, role: newUser.role as UserRole };
  } catch (error) {
    logger.error(
      { err: error, email, provider, correlationId },
      '[_createNewUserWithAccount] Failed to create user/account'
    );
    return null;
  }
}

/**
 * Handles an existing user: checks if the provider account exists and creates it if not.
 * @param providerAccountId - The user's ID for the provider.
 * @param correlationId - Correlation ID for logging.
 * @returns The user data in AuthUserInternal format.
 */
interface HandleExistingUserParams {
  dbUserWithAccounts: ExistingUserWithAccountsFromDB;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  provider: string;
  providerAccountId: string;
  correlationId: string;
}

async function _handleExistingUser(
  params: HandleExistingUserParams
): Promise<AuthUserInternal | null> {
  const { dbUserWithAccounts, profileData, provider, providerAccountId, correlationId } = params;
  const { email, name, image } = profileData;
  const logContext = {
    email,
    provider,
    userId: dbUserWithAccounts.id,
    providerAccountId,
    correlationId,
  };

  logger.debug(logContext, '[_handleExistingUser] User found. Checking accounts.');

  const accountExists = dbUserWithAccounts.accounts.some(
    acc => acc.provider === provider && acc.providerAccountId === providerAccountId
  );

  if (!accountExists) {
    logger.info(
      logContext,
      '[_handleExistingUser] Account not found for this provider. Attempting to link.'
    );
    try {
      await _createAccountForExistingUser(
        dbUserWithAccounts.id,
        provider,
        providerAccountId,
        correlationId
      );
      logger.info(logContext, '[_handleExistingUser] Successfully linked new account.');
    } catch (error) {
      logger.error(
        {
          ...logContext,
          err: error instanceof Error ? error : new Error(String(error)),
        },
        '[_handleExistingUser] Error during _createAccountForExistingUser. Returning null.'
      );
      return null; // Return null instead of re-throwing
    }
  }

  // Update user profile info if changed (optional, consider if this is desired behavior)
  // For now, assume we don't update on every sign-in, only on account creation/linking if needed

  const resultUser: AuthUserInternal = {
    id: dbUserWithAccounts.id,
    name: dbUserWithAccounts.name ?? name,
    email: dbUserWithAccounts.email ?? email,
    image: dbUserWithAccounts.image ?? image,
    role: dbUserWithAccounts.role as UserRole, // Assuming role is correctly typed on dbUser
  };

  logger.info(logContext, '[_handleExistingUser] Successfully processed existing user.');
  return resultUser;
}

/**
 * Internal helper to find or create a user and link/create an account.
 * This function encapsulates the core logic for provider-based sign-in.
 */
export async function findOrCreateUserAndAccountInternal(
  params: FindOrCreateUserParams
): Promise<AuthUserInternal | null> {
  const { email, profileData, providerAccountId, provider, correlationId } = params;
  try {
    const dbUserWithAccounts = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        accounts: { select: { provider: true, providerAccountId: true } },
      },
    });

    if (dbUserWithAccounts) {
      logger.info(
        { email, provider, correlationId, userId: dbUserWithAccounts.id },
        '[findOrCreateUserAndAccountInternal] User found, handling existing user account linking.'
      );
      return _handleExistingUser({
        dbUserWithAccounts: dbUserWithAccounts as ExistingUserWithAccountsFromDB,
        profileData,
        provider,
        providerAccountId,
        correlationId,
      });
    } else {
      logger.info(
        { email, provider, correlationId },
        '[findOrCreateUserAndAccountInternal] User not found, creating new user and account.'
      );
      return _createNewUserWithAccount({
        email,
        profileData,
        provider,
        providerAccountId,
        correlationId,
      });
    }
  } catch (error) {
    logger.error(
      { err: error, email, provider, correlationId },
      '[findOrCreateUserAndAccountInternal] Error during find or create user/account process'
    );
    return null;
  }
}

// Helper to validate signIn inputs
export function validateSignInInputs(
  user: NextAuthUser | AdapterUser | null | undefined,
  account: { provider: string; providerAccountId: string } | null | undefined,
  correlationId: string
): ValidateSignInResult {
  if (!user?.id || !user?.email) {
    logger.warn({ msg: 'Missing user ID or email during sign-in', user, correlationId });
    return { isValid: false };
  }
  if (!account?.provider || !account?.providerAccountId) {
    logger.warn({ msg: 'Missing account provider or providerAccountId', account, correlationId });
    return { isValid: false };
  }
  return { isValid: true, userId: user.id, userEmail: user.email };
}

// Helper to prepare profile data for DB insertion/update
// eslint-disable-next-line complexity
export function prepareProfileDataForDb(
  userId: string,
  userEmail: string,
  profile: Profile | null | undefined,
  user: NextAuthUser | AdapterUser | null | undefined
): { id: string; name?: string | null; email: string; image?: string | null } {
  let name: string | null = null;
  if (profile?.name) {
    name = profile.name;
  } else if (user?.name) {
    name = user.name;
  }

  let image: string | null = null;
  if (profile?.image && typeof profile.image === 'string') {
    image = profile.image;
  } else if (user?.image && typeof user.image === 'string') {
    image = user.image;
  }

  return {
    id: userId,
    email: userEmail,
    name: name,
    image: image,
  };
}

interface LogAuthErrorParams {
  logger: Logger;
  context: Record<string, unknown>;
  error: unknown;
  message: string;
  level?: 'warn' | 'error';
}

function _logAuthError(params: LogAuthErrorParams): void {
  const { logger, context, error, message, level = 'error' } = params;
  const logData = { ...context, error };

  if (level === 'warn') {
    logger.warn(logData, message);
  } else {
    logger.error(logData, message);
  }
}
