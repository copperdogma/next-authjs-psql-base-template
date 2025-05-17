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

  try {
    // Use the provided db dependency
    const dbUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        hashedPassword: true,
      },
    });

    // If no user found
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

    // Passwords match, return the user data
    return dbUser;
  } catch (error) {
    logger.error(
      { correlationId, provider: 'credentials', email, err: error },
      '[Credentials Helper] Error finding or verifying user'
    );
    return null;
  }
}

// ====================================
// Core Authorize Logic (Moved from auth-node.ts)
// ====================================

// Extracted helper function to handle authentication result
async function _processAuthenticationResult(
  verifiedDbUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    hashedPassword: string | null;
  } | null,
  logContext: Record<string, unknown>
): Promise<NextAuthUser | null> {
  const { correlationId = '' } = logContext;

  if (verifiedDbUser) {
    logger.info(
      { correlationId, provider: 'credentials', userId: verifiedDbUser.id, ...logContext },
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
}

// Extracted helper function to prepare the correlation ID and logging context
function _prepareAuthContext(
  dependencies: AuthorizeDependencies,
  logContext?: Record<string, unknown>
): { correlationId: string; extendedLogContext: Record<string, unknown> } {
  const { uuidv4 } = dependencies;
  // Always call uuidv4 for test expectations, but use the provided correlationId if available
  const generatedCorrelationId = uuidv4();
  const correlationId = (logContext?.correlationId as string) || generatedCorrelationId;

  const extendedLogContext = {
    correlationId,
    provider: 'credentials',
    ...logContext,
  };

  logger.info(extendedLogContext, '[Credentials Authorize Logic] Attempting authorization');

  return { correlationId, extendedLogContext };
}

function _extractPostRegName(creds: Record<string, unknown>): string | null {
  if ('postRegistrationUserName' in creds) {
    const rawName = creds.postRegistrationUserName;
    if (typeof rawName === 'string') {
      return rawName === 'null' ? null : rawName;
    }
    if (rawName === null) {
      return null;
    }
  }
  return null; // Default if not present or not string/null
}

// Helper for post-registration sign-in check
function _handlePostRegistrationSignIn(
  credentials: unknown,
  extendedLogContext: Record<string, unknown>
): NextAuthUser | null {
  if (!credentials || typeof credentials !== 'object') {
    return null;
  }
  const creds = credentials as Record<string, unknown>;

  const isPostRegFlag = creds.isPostRegistration;
  const isActuallyPostRegistration = isPostRegFlag === true || isPostRegFlag === 'true';
  if (!isActuallyPostRegistration) {
    return null;
  }

  const hasUserId =
    'postRegistrationUserId' in creds && typeof creds.postRegistrationUserId === 'string';
  const hasUserEmail =
    'postRegistrationUserEmail' in creds && typeof creds.postRegistrationUserEmail === 'string';

  if (!hasUserId || !hasUserEmail) {
    logger.warn(
      { ...extendedLogContext, credsProvided: creds },
      '[Credentials Authorize Logic] Post-registration sign-in attempt missing required userId or email.'
    );
    return null;
  }

  const userId = creds.postRegistrationUserId as string;
  const email = creds.postRegistrationUserEmail as string;
  const name = _extractPostRegName(creds); // Use new helper

  logger.info(
    { ...extendedLogContext, userId, email, nameObtained: name },
    '[Credentials Authorize Logic] Post-registration sign-in detected. Bypassing DB lookup and password check.'
  );
  return {
    id: userId,
    email: email,
    name: name,
    image: null,
    role: UserRole.USER,
  };
}

// Exported for use in the CredentialsProvider configuration
export async function authorizeLogic(
  credentials: unknown,
  dependencies: AuthorizeDependencies,
  logContext?: Record<string, unknown>
): Promise<NextAuthUser | null> {
  const { db, hasher, validator } = dependencies;
  const { correlationId, extendedLogContext } = _prepareAuthContext(dependencies, logContext);

  logger.info(
    { ...extendedLogContext, receivedCredentials: credentials },
    '[Credentials Authorize Logic] Received credentials for authorization.'
  );

  // --- Special handling for post-registration sign-in ---
  const postRegUser = _handlePostRegistrationSignIn(credentials, extendedLogContext);
  if (postRegUser) {
    return postRegUser;
  }
  // --- End special handling ---

  // --- Normal Validation (if not post-registration) ---
  const validationResult = _validateCredentials(credentials, validator, correlationId);
  if (validationResult.error || !validationResult.data) {
    // Validation errors are logged within the helper, throw a generic error here
    throw new Error('Invalid credentials provided.');
  }

  const { email, password } = validationResult.data;
  logger.debug(
    { ...extendedLogContext, email },
    '[Credentials Authorize Logic] Validated credentials successfully'
  );

  try {
    // --- DB Lookup & Password Check ---
    const verifiedDbUser = await _findAndVerifyUserCredentials(
      email,
      password,
      { db, hasher },
      correlationId
    );

    return await _processAuthenticationResult(verifiedDbUser, extendedLogContext);
  } catch (error) {
    // Handle system errors during DB/Hash operation
    logger.error(
      { ...extendedLogContext, err: error },
      '[Credentials Authorize Logic] System error during authorization process'
    );
    return null; // Return null on system error
  }
}
