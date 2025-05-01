import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import type { User as NextAuthUser } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { Profile } from 'next-auth';
import { type User as PrismaUserType } from '@prisma/client';

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
      select: { id: true, name: true, email: true, image: true, role: true }, // Select only needed fields
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
 * @param dbUserWithAccounts - The existing user data including accounts.
 * @param provider - The OAuth provider name.
 * @param providerAccountId - The user's ID for the provider.
 * @param correlationId - Correlation ID for logging.
 * @returns The user data in AuthUserInternal format.
 */
async function _handleExistingUser(
  // Correct the type annotation for the user object from Prisma
  dbUserWithAccounts: PrismaUserType & {
    accounts: { provider: string; providerAccountId: string }[];
  },
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<AuthUserInternal> {
  logger.info(
    { userId: dbUserWithAccounts.id, provider, correlationId },
    '[_handleExistingUser] Processing existing user'
  );
  const accountExists = dbUserWithAccounts.accounts.some(
    (account: { provider: string; providerAccountId: string }) =>
      account.provider === provider && account.providerAccountId === providerAccountId
  );

  if (!accountExists) {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[_handleExistingUser] Account does not exist, creating...'
    );
    await _createAccountForExistingUser(
      dbUserWithAccounts.id, // Prisma ID is string
      provider,
      providerAccountId,
      correlationId
    );
  } else {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[_handleExistingUser] Account already exists'
    );
  }

  // Convert Prisma user to internal format explicitly - replacing the faulty spread operator
  const resultUser: AuthUserInternal = {
    id: dbUserWithAccounts.id,
    name: dbUserWithAccounts.name,
    email: dbUserWithAccounts.email,
    image: dbUserWithAccounts.image,
    // Cast the role from Prisma enum ('USER') to our internal UserRole enum
    role: dbUserWithAccounts.role as UserRole, // Assuming PrismaUserRole ('USER') matches UserRole ('USER')
  };
  return resultUser;
}

// Finds or creates a user and associated account record.
export async function findOrCreateUserAndAccountInternal({
  email,
  profileData,
  providerAccountId,
  provider,
  correlationId,
}: FindOrCreateUserParams): Promise<AuthUserInternal | null> {
  const logContext = { email, provider, correlationId };

  try {
    // 1. Find user by email, including their accounts
    const dbUserWithAccounts = await prisma.user.findUnique({
      where: { email },
      include: { accounts: { select: { provider: true, providerAccountId: true } } },
    });

    let resultUser: AuthUserInternal | null = null;

    if (dbUserWithAccounts) {
      // 2a. User exists: Handle potential new account linking
      resultUser = await _handleExistingUser(
        dbUserWithAccounts,
        provider,
        providerAccountId,
        correlationId
      );
    } else {
      // 2b. User does not exist: Create new user and account
      logger.info(logContext, '[findOrCreateUserInternal] User not found, attempting creation...');
      resultUser = await _createNewUserWithAccount({
        email,
        profileData,
        provider,
        providerAccountId,
        correlationId,
      });
    }

    // 3. Final check and return
    if (!resultUser) {
      logger.error(logContext, '[findOrCreateUserInternal] Failed to find or create user.');
      return null;
    }
    return resultUser;
  } catch (error) {
    logger.error({
      ...logContext,
      msg: '[findOrCreateUserInternal] Error during find/create process',
      error:
        error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    });
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
