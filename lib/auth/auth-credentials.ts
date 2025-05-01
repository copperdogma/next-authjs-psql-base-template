import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';
import bcrypt from 'bcryptjs';
import type { v4 as uuidv4 } from 'uuid';
import type { User as NextAuthUser } from 'next-auth';
import { z } from 'zod';

// ====================================
// Interfaces (Moved from auth-node.ts)
// ====================================

// Interface for validator dependency
interface Validator<T> {
  safeParse: (data: Record<string, string> | undefined) => {
    success: boolean;
    data?: T;
    error?: z.ZodError | undefined;
  };
}

// Interface for authorize dependencies
// Exported because it's used in the config file to prepare dependencies
export interface AuthorizeDependencies {
  db: {
    user: {
      findUnique: typeof prisma.user.findUnique;
    };
  };
  hasher: {
    compare: typeof bcrypt.compare;
  };
  validator: Validator<{ email: string; password: string }>;
  uuidv4: typeof uuidv4;
}

// ====================================
// Credentials Schema (Moved from auth-node.ts)
// ====================================

// Define Zod schema for credentials validation - Exported for use in config
export const CredentialsSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// ====================================
// Helper function to validate credentials using the provided validator
// ====================================

// Helper function to validate credentials using the provided validator
function _validateCredentials(
  credentials: unknown,
  validator: Validator<{ email: string; password: string }>,
  correlationId: string
): { data?: { email: string; password: string }; error?: string } {
  // 1. Initial Type Check (Return early)
  if (typeof credentials !== 'object' || credentials === null) {
    logger.warn(
      { correlationId, provider: 'credentials', receivedType: typeof credentials },
      '[Credentials Validation] Invalid credentials type received.'
    );
    return { error: 'Invalid credentials format.' };
  }

  // 2. Validation using the provided validator
  const validationResult = validator.safeParse(credentials as Record<string, string> | undefined);

  // 3. Handle Validation Failure (Combined check for success and data)
  if (!validationResult.success || !validationResult.data) {
    const firstError =
      validationResult.error?.flatten().fieldErrors?.[
        Object.keys(validationResult.error.flatten().fieldErrors)[0]
      ]?.[0];
    logger.warn(
      {
        correlationId,
        provider: 'credentials',
        errors: validationResult.error?.format(),
      },
      `[Credentials Validation] Invalid credentials: ${firstError || 'Validation failed'}`
    );
    // Consistent error message for external callers
    return { error: 'Invalid credentials.' };
  }

  // 4. Return Success
  return { data: validationResult.data };
}

// Helper function to find user and verify password
async function _findAndVerifyUserCredentials(
  email: string,
  passwordToVerify: string,
  dependencies: Pick<AuthorizeDependencies, 'db' | 'hasher'>, // Pass relevant dependencies
  correlationId: string
): Promise<{
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string; // Keep as string initially, cast later
  hashedPassword: string | null;
} | null> {
  const { db, hasher } = dependencies; // Destructure db and hasher here

  const dbUser = await db.user.findUnique({
    where: { email },
  });

  if (!dbUser || !dbUser.hashedPassword) {
    logger.warn(
      { correlationId, provider: 'credentials', email },
      '[Credentials Helper] User not found or no password set'
    );
    return null;
  }

  const passwordsMatch = await hasher.compare(passwordToVerify, dbUser.hashedPassword);

  if (!passwordsMatch) {
    logger.warn(
      { correlationId, provider: 'credentials', userId: dbUser.id },
      '[Credentials Helper] Incorrect password'
    );
    return null;
  }

  // Passwords match, return the raw user data from DB
  return dbUser;
}

// ====================================
// Core Authorize Logic (Moved from auth-node.ts)
// ====================================

// Exported for use in the CredentialsProvider configuration
// eslint-disable-next-line max-statements -- Statement count is minimally over limit after significant refactoring.
export async function authorizeLogic(
  credentials: unknown, // Keep unknown for flexibility, but check below
  dependencies: AuthorizeDependencies
): Promise<NextAuthUser | null> {
  const { db, hasher, validator, uuidv4 } = dependencies;
  const correlationId = uuidv4();

  logger.info(
    { correlationId, provider: 'credentials' },
    '[Credentials Authorize Logic] Attempting authorization'
  );

  // --- Validation ---
  const validationResult = _validateCredentials(credentials, validator, correlationId);
  if (validationResult.error || !validationResult.data) {
    // Validation errors are logged within the helper, throw a generic error here
    throw new Error('Invalid credentials provided.');
  }
  const { email, password } = validationResult.data;
  logger.debug(
    { correlationId, provider: 'credentials', email },
    '[Credentials Authorize Logic] Validated credentials successfully'
  );

  // --- DB Lookup & Password Check ---
  try {
    const verifiedDbUser = await _findAndVerifyUserCredentials(
      email,
      password,
      { db, hasher }, // Pass db and hasher from dependencies
      correlationId
    );

    if (verifiedDbUser) {
      logger.info(
        { correlationId, provider: 'credentials', userId: verifiedDbUser.id },
        '[Credentials Authorize Logic] Authorization successful'
      );
      // Map to NextAuthUser format
      return {
        id: verifiedDbUser.id,
        name: verifiedDbUser.name,
        email: verifiedDbUser.email,
        image: verifiedDbUser.image,
        role: verifiedDbUser.role as UserRole, // Cast role here
      };
    } else {
      // User not found or password mismatch (already logged in helper)
      return null;
    }
  } catch (error) {
    // Handle system errors during DB/Hash operation
    logger.error(
      { correlationId, provider: 'credentials', email, err: error },
      '[Credentials Authorize Logic] System error during authorization process'
    );
    return null; // Return null on system error
  }
}
