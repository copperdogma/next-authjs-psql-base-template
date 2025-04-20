import { type JWT } from '@auth/core/jwt';
import { type Account, type Profile, type User as NextAuthUser } from 'next-auth';
import { type AdapterUser } from 'next-auth/adapters';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';
import { type User as PrismaUser } from '@prisma/client';

// Re-define or import necessary interfaces if they were moved

// Define interface for our custom AuthUser structure used internally (mapping from DB)
export interface AuthUserInternal {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// Define interface for parameters used in handleJwtSignIn
export interface HandleJwtSignInParams {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile | null;
  correlationId: string;
}

// Define interface for parameters used in findOrCreateUserAndAccount
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

// Interface for parameters for _createNewUserWithAccount
interface CreateNewUserParams {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  provider: string;
  providerAccountId: string;
  correlationId: string;
}

// ====================================
// Internal Helper Functions for User/Account Management
// ====================================

// Creates an account for an existing user
export async function _createAccountForExistingUser(
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
export async function _createNewUserWithAccount(
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
  dbUserWithAccounts: PrismaUser & { accounts: { provider: string; providerAccountId: string }[] },
  provider: string,
  providerAccountId: string,
  correlationId: string
): Promise<AuthUserInternal> {
  logger.info(
    { userId: dbUserWithAccounts.id, provider, correlationId },
    '[findOrCreateUserInternal:_handleExistingUser] Processing existing user'
  );
  const accountExists = dbUserWithAccounts.accounts.some(
    account => account.provider === provider && account.providerAccountId === providerAccountId
  );

  if (!accountExists) {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[findOrCreateUserInternal:_handleExistingUser] Account does not exist, creating...'
    );
    await _createAccountForExistingUser(
      dbUserWithAccounts.id,
      provider,
      providerAccountId,
      correlationId
    );
  } else {
    logger.info(
      { userId: dbUserWithAccounts.id, provider, correlationId },
      '[findOrCreateUserInternal:_handleExistingUser] Account already exists'
    );
  }

  // Convert Prisma user to internal format
  const resultUser: AuthUserInternal = {
    ...dbUserWithAccounts,
    role: dbUserWithAccounts.role as UserRole,
  };
  return resultUser;
}

// Renamed from findOrCreateUserAndAccount to avoid potential naming conflicts if imported directly
export async function findOrCreateUserAndAccountInternal({
  email,
  profileData,
  providerAccountId,
  provider,
  correlationId,
}: FindOrCreateUserParams): Promise<AuthUserInternal | null> {
  const logContext = { email, provider, correlationId };

  try {
    // logger.info(logContext, '[findOrCreateUserInternal] Starting user/account lookup...'); // Removed for brevity

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
        // Directly assign result
        email,
        profileData,
        provider,
        providerAccountId,
        correlationId,
      });
      // No need for separate newUserResult check, _createNewUserWithAccount returns null on failure
    }

    // 3. Final check and return
    if (!resultUser) {
      logger.error(logContext, '[findOrCreateUserInternal] Failed to find or create user.');
      return null;
    }

    // logger.info( // Removed for brevity
    //   { ...logContext, userId: resultUser.id },
    //   '[findOrCreateUserInternal] Completed successfully.'
    // );
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
// MOVED to lib/auth-jwt-helpers.ts
// export function validateSignInInputs(
//   user: NextAuthUser | AdapterUser | null | undefined,
//   account: Account | null | undefined,
//   correlationId: string
// ): ValidateSignInResult { ... }

// Helper to build the final JWT
// MOVED to lib/auth-jwt-helpers.ts
// export function buildNewJwt(token: JWT, dbUser: AuthUserInternal): JWT { ... }

// Helper to prepare profile data for DB insertion/update
// MOVED to lib/auth-jwt-helpers.ts
// export function _prepareProfileDataForDb(
//   userId: string,
//   userEmail: string,
//   profile: Profile | null | undefined,
//   user: NextAuthUser | AdapterUser | null | undefined
// ): { id: string; name?: string | null; email: string; image?: string | null } { ... }

// Helper function for JWT signIn trigger
// MOVED to lib/auth-jwt-helpers.ts
// export async function handleJwtSignIn(params: HandleJwtSignInParams): Promise<JWT> { ... }

// Helper function for JWT update trigger
// MOVED to lib/auth-jwt-helpers.ts
// export async function handleJwtUpdate(token: JWT, correlationId: string): Promise<JWT> { ... }
