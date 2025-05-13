'use server'; // Restore directive

/* eslint-disable max-lines -- Disabled: This file contains multiple related server actions 
   (registration, credentials auth) and their associated helper functions. 
   Significant refactoring has already been done to break down logic internally. 
   Further splitting might reduce clarity and cohesion more than the length limit warrants. */

import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import * as admin from 'firebase-admin';
// import { redirect } from 'next/navigation'; // Removed unused import
import type { Logger as PinoLogger } from 'pino'; // Import type explicitly
// import pino from 'pino'; // Removed unused direct import

import { logger as rootLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { firebaseAdminService } from '@/lib/server/services';
import { signIn } from '@/lib/auth-node';
import type { ServiceResponse } from '@/types';
import { type Redis } from 'ioredis';
// Removed unused imports
// import { rateLimit } from '@/lib/redis';
// import { type CreateUserSchema } from '@/lib/schemas';
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
// import { UserService } from '@/lib/services/user-service';
// import { logger as rootLogger, createLogger } from '@/lib/logger'; // Import base logger

// --- BEGIN IMPORT ERROR HELPERS ---
import {
  _translateFirebaseAuthError,
  _translatePrismaError,
  _translateGenericError,
  _translateRegistrationError,
  RollbackError, // Add import for RollbackError
  // isPrismaError, // Removed unused import
} from './auth-error-helpers';
// --- END IMPORT ERROR HELPERS ---

// --- BEGIN RATE LIMITING IMPORTS ---
import { getOptionalRedisClient } from '@/lib/redis';
import { getClientIp } from '@/lib/utils/server-utils';
import { env } from '@/lib/env';
// --- END RATE LIMITING IMPORTS ---

// Constants
const SALT_ROUNDS = 10;

const actionLogger = rootLogger.child({ module: 'auth-actions' });

// --- Schemas ---
const RegistrationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});
type RegistrationInput = z.infer<typeof RegistrationSchema>;

// --- Locally Defined Interfaces --- //

// Interface for the DB client subset needed by registration logic
interface RegisterUserDbClient {
  user: {
    findUnique: typeof prisma.user.findUnique;
    create: typeof prisma.user.create;
  };
}

// Interface for the password hasher subset needed
interface Hasher {
  hash: (password: string, saltOrRounds: number) => Promise<string>;
}

// Define the expected structure for error details within RegistrationResult
interface RegistrationErrorDetails {
  originalError?: unknown;
  validationErrors?: Record<string, string[]>;
}

// Use the imported ServiceResponse type correctly
// TErrorDetails generic applies to the 'details' property within the inline 'error' object
type RegistrationResult = ServiceResponse<null, RegistrationErrorDetails>;

// Structure expected by _performRegistrationAttempt
interface PerformRegistrationDeps {
  db: RegisterUserDbClient;
  hasher: Hasher;
  fbService: FirebaseAdminService;
}

// Interface for optional dependencies passed into the main action logic
interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  fbService?: FirebaseAdminService;
  logger?: PinoLogger; // Use imported type
}

// --- Private Helper Functions --- //

async function _validateRegistrationInput(
  formData: FormData
): Promise<z.SafeParseReturnType<RegistrationInput, RegistrationInput>> {
  const rawFormData = Object.fromEntries(formData.entries());
  return RegistrationSchema.safeParse(rawFormData);
}

async function _createFirebaseUser(
  data: { email: string; password?: string; name?: string | null },
  fbService: FirebaseAdminService,
  logContext: { email: string }
): Promise<admin.auth.UserRecord> {
  actionLogger.debug(logContext, '_createFirebaseUser: Attempting...');
  try {
    const firebaseUser = await fbService.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name ?? undefined, // Handle potential null name
    });
    actionLogger.info({ ...logContext, uid: firebaseUser.uid }, '_createFirebaseUser: Success');
    return firebaseUser;
  } catch (error) {
    actionLogger.error({ ...logContext, error }, '_createFirebaseUser: FAILED');
    throw error;
  }
}

async function _createPrismaUser(
  firebaseUser: admin.auth.UserRecord,
  passwordToHash: string,
  services: { db: RegisterUserDbClient; hasher: Hasher; fbService: FirebaseAdminService },
  logContext: { email?: string | null; uid?: string }
): Promise<User | RegistrationResult> {
  const { db, hasher, fbService } = services;
  actionLogger.debug(logContext, '_createPrismaUser: Starting Prisma user creation process...');

  const email = firebaseUser.email;
  if (!email) {
    actionLogger.error(
      { ...logContext, uid: firebaseUser.uid }, // Add uid to this specific log
      '_createPrismaUser: Firebase user record unexpectedly missing email.'
    );
    throw new Error('Firebase user record missing email during Prisma user creation.');
  }
  const logContextBase = {
    email: email, // Now guaranteed to be a string
    uid: firebaseUser.uid,
  };

  // Check if user already exists in Prisma by email
  actionLogger.debug(logContextBase, '_createPrismaUser: Checking for existing user by email...');

  actionLogger.debug(logContextBase, '_createPrismaUser: Hashing password...');
  const hashedPassword = await hasher.hash(passwordToHash, SALT_ROUNDS);
  actionLogger.debug(logContextBase, '_createPrismaUser: Attempting DB create...');

  try {
    const prismaUser = await db.user.create({
      data: {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: email,
        hashedPassword,
        emailVerified: firebaseUser.emailVerified ? new Date() : null,
      },
    });
    actionLogger.debug(
      { ...logContextBase, userId: prismaUser.id },
      '_createPrismaUser: DB create success'
    );
    return prismaUser;
  } catch (dbError) {
    actionLogger.warn(
      { ...logContextBase, error: dbError },
      '_createPrismaUser: Prisma create failed. Initiating rollback.'
    );
    if (!firebaseUser) {
      actionLogger.error(
        { ...logContextBase, error: dbError },
        '_createPrismaUser: Firebase user record unexpectedly missing WITHIN catch block.'
      );
      return _handleMainRegistrationError(dbError, 'prisma create with missing firebase record');
    }
    // Firebase record exists, proceed with rollback logic.
    // _handlePrismaCreateFailure returns a RollbackError instance.
    const rollbackErrorInstance = await _handlePrismaCreateFailure(
      firebaseUser,
      fbService,
      logContextBase,
      dbError
    );
    // Now, use _handleMainRegistrationError to convert this RollbackError into a RegistrationResult.
    actionLogger.debug(
      { ...logContextBase, rollbackErrorInstance },
      '_createPrismaUser: Prisma catch returning error response via _handleMainRegistrationError.'
    );
    return _handleMainRegistrationError(rollbackErrorInstance, 'prisma creation/rollback');
  }
}

/**
 * Handles the specific scenario where Prisma user creation fails *after* Firebase user creation.
 * Attempts to roll back the Firebase user creation.
 * ALWAYS throws an error (either RollbackError for success/failure or the original error if rollback fails unexpectedly).
 * UPDATE: Now RETURNS a RollbackError instance instead of throwing.
 */
async function _handlePrismaCreateFailure(
  firebaseUser: admin.auth.UserRecord, // Must be non-null here
  fbService: FirebaseAdminService,
  baseLogContext: { email?: string | null },
  originalDbError: unknown // Keep a reference to the original DB error for context if needed
): Promise<RollbackError> {
  // This function always throws
  actionLogger.warn(
    { ...baseLogContext, firebaseUid: firebaseUser.uid, dbError: originalDbError },
    '_createUser: Prisma user creation failed after Firebase user was created. Attempting to roll back Firebase user.'
  );
  try {
    await fbService.deleteUser(firebaseUser.uid);
    actionLogger.info(
      { ...baseLogContext, firebaseUid: firebaseUser.uid },
      '_createUser: Successfully rolled back (deleted) Firebase user.'
    );
    // Return a RollbackError indicating rollback succeeded
    return new RollbackError(
      'Prisma create failed, Firebase user rollback successful.',
      originalDbError
    );
  } catch (rollbackError) {
    actionLogger.error(
      {
        ...baseLogContext,
        firebaseUid: firebaseUser.uid,
        rollbackError,
        originalDbError,
      },
      '_createUser: FAILED to roll back Firebase user after Prisma create failure.'
    );
    // Return a RollbackError indicating rollback failure, include original DB error and rollback error
    return new RollbackError(
      'Database user creation failed AND Firebase user rollback FAILED.',
      originalDbError
    );
  }
}

async function _attemptPostRegistrationSignIn(
  email: string,
  passwordAttempt: string,
  log: PinoLogger // Use imported type
): Promise<RegistrationResult | null> {
  log.debug({ email }, '_attemptPostRegistrationSignIn: Attempting sign-in after registration...');
  try {
    // Use signIn directly from auth-node which handles CredentialsProvider
    const signInResult = await signIn('credentials', {
      email,
      password: passwordAttempt,
      redirect: false, // Important: Do not redirect from server action
    });

    // Check if signIn returned an error (NextAuth specific error structure)
    if (signInResult?.error) {
      log.warn(
        { email, signInError: signInResult.error },
        '_attemptPostRegistrationSignIn: signIn failed after registration.'
      );
      // Translate the NextAuth-specific error if possible, otherwise return generic
      // Assuming CredentialsSignin means validation/match failure, but could be others
      if (signInResult.error === 'CredentialsSignin') {
        return {
          status: 'error',
          message: 'Post-registration sign-in failed (Credentials). Please log in manually.', // More specific message
          error: {
            code: 'POST_REGISTRATION_SIGNIN_CREDENTIALS_FAILED',
            message: 'Post-registration sign-in failed (Credentials). Please log in manually.',
          },
        };
      }
      // Generic sign-in failure post-registration
      return {
        status: 'error',
        message: 'Post-registration sign-in failed. Please log in manually.',
        error: {
          code: 'POST_REGISTRATION_SIGNIN_FAILED',
          message: `Sign-in failed after registration: ${signInResult.error}`,
          details: { originalError: signInResult.error },
        },
      };
    }

    log.info({ email }, '_attemptPostRegistrationSignIn: Sign-in successful after registration.');
    // If signIn succeeded without error and didn't redirect (due to redirect:false), return null to indicate success handled.
    // The main function will return the final success message.
    return null;
  } catch (error) {
    log.error(
      { email, error },
      '_attemptPostRegistrationSignIn: Unexpected error during post-registration sign-in attempt.'
    );
    // Return a generic error response if the signIn call itself throws unexpectedly
    return {
      status: 'error',
      message: 'An unexpected error occurred during post-registration sign-in.',
      error: {
        code: 'POST_REGISTRATION_SIGNIN_UNEXPECTED_ERROR',
        message: 'An unexpected error occurred during post-registration sign-in.',
        details: { originalError: error },
      },
    };
  }
}

async function _handleMainRegistrationError(
  error: unknown,
  context: string,
  _log?: PinoLogger // Optional logger param, prefix with underscore if unused by design
): Promise<RegistrationResult> {
  const logContext = { error, registrationContext: context };
  actionLogger.error(
    logContext,
    '_handleMainRegistrationError: Caught error during registration attempt.'
  );

  let errorCode = 'UNKNOWN_REGISTRATION_ERROR';
  let errorMessage = 'An unexpected error occurred during registration.';
  let errorDetails: RegistrationErrorDetails = { originalError: error };

  // Handle RollbackError specifically
  if (error instanceof RollbackError) {
    actionLogger.warn(
      { ...logContext, originalDbError: error.originalError },
      `Registration failed: ${error.message}`
    );
    errorMessage = error.message; // Use the message from RollbackError
    // Determine code based on the message content
    if (error.message.includes('rollback FAILED')) {
      errorCode = 'REGISTRATION_DB_FAILURE_ROLLBACK_FAILURE';
    } else {
      // This is the success case where Firebase user was successfully rolled back
      errorCode = 'REGISTRATION_DB_FAILURE_ROLLBACK_SUCCESS';
    }
    errorDetails = {
      originalError: error.originalError, // Keep the original DB error
    };
  } else {
    // Use the translation utility for other error types
    const translated = _translateRegistrationError(error);
    errorMessage = translated.message;
    errorCode = translated.code;
    errorDetails = { originalError: error }; // Store the original error
  }

  return {
    status: 'error',
    message: errorMessage,
    error: {
      code: errorCode,
      message: errorMessage, // Include message in error object too
      details: errorDetails,
    },
  };
}

// --- Rate Limiting Logic --- //
interface RateLimitResult {
  limited: boolean;
  error?: boolean; // Indicates if the check itself failed, not if user is rate limited
}

interface ExecuteRateLimitPipelineOptions {
  key: string;
  windowSeconds: number;
  clientIp: string; // For logging context
}

async function _executeRateLimitPipeline(
  redisClient: Redis, // Assumed to be non-null when this is called
  options: ExecuteRateLimitPipelineOptions,
  log: PinoLogger // Use imported type
): Promise<{ currentAttempts?: number; errorOccurred: boolean }> {
  const { key, windowSeconds, clientIp } = options;
  const logContext = { redisKey: key, clientIp };
  log.debug(logContext, 'Executing rate limit pipeline...');

  try {
    const pipeline = redisClient.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec();
    log.debug({ ...logContext, results }, 'Rate limit pipeline executed.');

    // Check for pipeline execution errors first
    if (!results) {
      log.error(logContext, 'Redis pipeline execution returned null/undefined.');
      return { errorOccurred: true };
    }

    // Check for errors in individual command results
    const incrResult = results[0];
    // const expireResult = results[1]; // Expire result often not checked

    if (incrResult && incrResult[0]) {
      // results[0][0] holds the error for the INCR command
      log.error(
        { ...logContext, redisError: incrResult[0] },
        'Error during Redis INCR in pipeline.'
      );
      return { errorOccurred: true };
    }

    // We expect results[0][1] to be the count after incrementing
    const currentAttemptsRaw = incrResult ? incrResult[1] : undefined;

    if (typeof currentAttemptsRaw !== 'number') {
      log.error(
        { ...logContext, incrResultRaw: currentAttemptsRaw },
        'Invalid result type from Redis INCR.'
      );
      return { errorOccurred: true }; // Treat unexpected type as an error
    }

    log.debug(
      { ...logContext, currentAttempts: currentAttemptsRaw },
      'Rate limit check successful.'
    );
    return { currentAttempts: currentAttemptsRaw, errorOccurred: false };
  } catch (error) {
    log.error({ ...logContext, error }, 'Generic error during Redis pipeline execution.');
    return { errorOccurred: true }; // Treat pipeline exec errors as rate check failure
  }
}

async function _checkRegistrationRateLimit(
  redisClient: Redis | null,
  clientIp: string,
  log: PinoLogger // Use imported type
): Promise<RateLimitResult> {
  const logContext = { clientIp };
  log.debug(logContext, 'Checking registration rate limit...');

  if (!redisClient) {
    log.warn(
      'Redis client is not available for registration. Skipping rate limiting. Failing open.'
    );
    return { limited: false }; // Fail open if Redis is down
  }

  const maxAttempts = env.RATE_LIMIT_REGISTER_MAX_ATTEMPTS;
  const windowSeconds = env.RATE_LIMIT_REGISTER_WINDOW_SECONDS;
  const key = `rate-limit:register:${clientIp}`;

  log.debug({ ...logContext, key, maxAttempts, windowSeconds }, 'Rate limit parameters');

  const { currentAttempts, errorOccurred } = await _executeRateLimitPipeline(
    redisClient,
    { key, windowSeconds, clientIp },
    log
  );

  if (errorOccurred) {
    log.error({ ...logContext, key }, 'Rate limit check failed due to Redis error. Failing open.');
    return { limited: false, error: true }; // Fail open, but signal check error
  }

  // currentAttempts should be defined if errorOccurred is false
  if (typeof currentAttempts !== 'number') {
    // Should not happen if errorOccurred is false, but defensively check
    log.error(
      { ...logContext, key, currentAttempts },
      'Rate limit check failed: currentAttempts is undefined despite no reported error. Failing open.'
    );
    return { limited: false, error: true }; // Fail open, signal check error
  }

  if (currentAttempts > maxAttempts) {
    log.warn({ ...logContext, key, currentAttempts, maxAttempts }, 'Rate limit exceeded.');
    return { limited: true };
  }

  log.debug({ ...logContext, key, currentAttempts, maxAttempts }, 'Rate limit check passed.');
  return { limited: false };
}

// --- Core Registration Logic --- //

/**
 * Performs the main registration steps: creating Firebase user, creating Prisma user,
 * and attempting post-registration sign-in. Assumes input is validated and rate limit passed.
 */
async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: { email: string }
): Promise<RegistrationResult | null> {
  // Return type might need adjustment if errors always throw
  const { db, hasher, fbService } = services;
  const { email, password, name } = validatedData;
  let firebaseUserRecord: admin.auth.UserRecord | null = null; // Declare here to be accessible in catch
  let registrationErrorResult: RegistrationResult | null = null; // Variable to hold error from inner block

  try {
    // 1. Create Firebase User
    firebaseUserRecord = await _createFirebaseUser(
      { email, password, name },
      fbService,
      logContext
    );

    // 2. Create Prisma User - Wrapped in try/catch for rollback
    let prismaUser: User | null = null; // Initialize to null
    try {
      // Ensure the logContext passed has the uid
      const prismaLogContext = { ...logContext, uid: firebaseUserRecord.uid };
      const prismaUserResult = await _createPrismaUser(
        firebaseUserRecord,
        password,
        { db, hasher, fbService },
        prismaLogContext
      );

      // Check if the result is a User object or a RegistrationResult
      if ('error' in prismaUserResult || 'status' in prismaUserResult) {
        // It's a RegistrationResult, handle the error
        actionLogger.warn(
          { ...logContext, error: prismaUserResult.error },
          '_performRegistrationAttempt: Prisma user creation returned an error result.'
        );
        return prismaUserResult;
      }

      // It's a User object
      prismaUser = prismaUserResult;
      actionLogger.info(
        { ...logContext, userId: prismaUser.id },
        '_performRegistrationAttempt: Prisma user created'
      );
    } catch (dbError) {
      actionLogger.warn(
        { ...logContext, error: dbError },
        '_performRegistrationAttempt: Prisma create failed. Initiating rollback.'
      );
      if (!firebaseUserRecord) {
        actionLogger.error(
          { ...logContext, error: dbError },
          '_performRegistrationAttempt: Firebase user record missing after successful creation attempt during Prisma failure. Cannot rollback.'
        );
        registrationErrorResult = await _handleMainRegistrationError(
          dbError,
          'prisma create with missing firebase record'
        );
      } else {
        const rollbackErrorInstance = await _handlePrismaCreateFailure(
          firebaseUserRecord,
          fbService,
          logContext,
          dbError
        );
        registrationErrorResult = await _handleMainRegistrationError(
          rollbackErrorInstance,
          'prisma creation/rollback'
        );
      }
    }

    // --- Check if an error occurred during Prisma/Rollback ---
    if (registrationErrorResult) {
      actionLogger.debug(
        { ...logContext, registrationErrorResult },
        '_performRegistrationAttempt: Returning error captured from Prisma/Rollback block.'
      );
      return registrationErrorResult;
    }

    // If we reach here, Prisma user creation succeeded (prismaUser should be set) and no error was captured.
    if (!prismaUser) {
      actionLogger.error(
        { ...logContext },
        '_performRegistrationAttempt: Reached post-Prisma block but prismaUser is null and no error was captured.'
      );
      return _handleMainRegistrationError(
        new Error('Internal state error after Prisma user creation attempt'),
        'internal state inconsistency'
      );
    }

    // 3. Attempt Sign In (if Prisma user created successfully)
    return await _attemptPostRegistrationSignIn(email, password, actionLogger);
  } catch (error) {
    // This top-level catch handles Firebase creation errors OR errors thrown by _handlePrismaCreateFailure
    // (like RollbackError or the error from fbService.deleteUser failing)
    // OR the re-thrown dbError if firebaseUserRecord was unexpectedly null.
    actionLogger.error(
      { ...logContext, error },
      '_performRegistrationAttempt: Error during registration or rollback.'
    );
    const errorResponse = _handleMainRegistrationError(error, 'registration attempt');
    actionLogger.debug(
      { ...logContext, errorResponse },
      '_performRegistrationAttempt: Returning error response from outer catch.'
    );
    return errorResponse;
  }
}

// Helper function to resolve dependencies
interface ResolvedRegisterDeps {
  log: PinoLogger; // Use imported type
  fbService: FirebaseAdminService;
  db: RegisterUserDbClient;
  hasher: Hasher;
}

function _resolveRegisterDependencies(deps?: RegisterUserOptionalDeps): ResolvedRegisterDeps {
  const resolvedLogger = deps?.logger ?? actionLogger;
  // Note: Non-null assertion used below. Assumes actionLogger is always initialized.
  // Consider adding a check if stricter null safety is needed in the future.
  resolvedLogger.debug('_resolveRegisterDependencies: Resolving dependencies...');

  // Ensure fbService is explicitly typed and not undefined
  // firebaseAdminService is imported at module level so it should never be undefined
  // but TypeScript might not infer this, so we use non-null assertion
  const resolvedFbService = (deps?.fbService ?? firebaseAdminService)!;

  const resolvedDb = deps?.db ?? { user: prisma.user };
  const resolvedHasher = deps?.hasher ?? { hash };

  return {
    log: resolvedLogger,
    fbService: resolvedFbService,
    db: resolvedDb,
    hasher: resolvedHasher,
  };
}

// Helper function to handle rate limiting check
async function _handleRegistrationRateLimit(
  log: PinoLogger, // Use imported type
  logContext: { email: string },
  clientIp: string | null | undefined
): Promise<RegistrationResult | null> {
  // Returns error response or null if OK
  if (!clientIp) {
    log.warn('Could not determine client IP for rate limiting. Failing open.');
    return null; // Fail open
  }
  const ipToCheck = clientIp || 'fallback-ip'; // Should not be needed due to check above, but defensive
  const redisClient = await getOptionalRedisClient();
  const rateLimitResult = await _checkRegistrationRateLimit(redisClient, ipToCheck, log);

  if (rateLimitResult.error) {
    log.warn(
      { ...logContext, clientIp: ipToCheck },
      'Rate limit check failed, but proceeding (fail open).'
    );
    return null; // Fail open
  } else if (rateLimitResult.limited) {
    log.warn({ ...logContext, clientIp: ipToCheck }, 'Registration rate limit exceeded.');
    return {
      status: 'error',
      message: 'Registration rate limit exceeded for this IP.',
      error: {
        code: 'RateLimitExceeded',
        message: 'Registration rate limit exceeded for this IP.',
      },
    };
  }
  log.debug({ ...logContext, clientIp: ipToCheck }, 'Rate limit check passed.');
  return null; // OK
}

// Helper function to check for existing Prisma user
async function _checkExistingPrismaUser(
  log: PinoLogger, // Use imported type
  logContext: { email: string },
  emailToCheck: string,
  db: RegisterUserDbClient
): Promise<RegistrationResult | null> {
  // Returns error response or null if OK
  try {
    const existingUser = await db.user.findUnique({
      where: { email: emailToCheck },
    });
    if (existingUser) {
      log.warn(logContext, 'Registration attempt with existing email.');
      return {
        status: 'error',
        message: 'User with this email already exists.',
        error: {
          code: 'UserExists',
          message: 'User with this email already exists.',
        },
      };
    }
    return null; // User does not exist
  } catch (dbCheckError) {
    log.error(
      { ...logContext, error: dbCheckError },
      'Error checking for existing user in database.'
    );
    return _handleMainRegistrationError(dbCheckError, 'checking existing user');
  }
}

/**
 * Main logic for user registration, handling validation, rate limiting,
 * user creation in Firebase and Prisma, and post-registration sign-in attempt.
 * Dependencies are passed explicitly or default implementations are used.
 */
export async function registerUserLogic(
  formData: FormData,
  deps?: RegisterUserOptionalDeps
): Promise<RegistrationResult> {
  // --- 1. Resolve Dependencies & Logger ---
  const { log, fbService, db, hasher } = _resolveRegisterDependencies(deps);
  log.info('registerUserLogic: Starting registration process...');

  // --- Pre-check: Service Availability ---
  if (!fbService) {
    const logCtx = { errorCode: 'ServiceUnavailable' };
    log.warn(logCtx, 'Firebase Admin Service is not available for registration.');
    return {
      status: 'error',
      message: 'Firebase Admin Service not available.',
      error: {
        code: 'ServiceUnavailable',
        message: 'Firebase Admin Service not available.',
      },
    };
  }

  // --- 2. Input Validation ---
  const validationResult = await _validateRegistrationInput(formData);
  if (!validationResult.success) {
    const validationErrors = validationResult.error.flatten().fieldErrors;
    const logCtx = { validationErrors };
    log.warn(logCtx, 'Registration input validation failed.');
    return {
      status: 'error',
      message: 'Invalid input.',
      error: {
        code: 'ValidationError',
        message: 'Invalid input.', // Consistent message
        details: { validationErrors },
      },
    };
  }
  const validatedData = validationResult.data;
  const logContext = { email: validatedData.email }; // Base log context for subsequent steps
  log.debug(logContext, 'Registration input validation successful.');

  // --- 3. Rate Limiting ---
  const clientIp = await getClientIp(); // Add await here to resolve the Promise
  const rateLimitError = await _handleRegistrationRateLimit(log, logContext, clientIp);
  if (rateLimitError) {
    return rateLimitError;
  }

  // --- 4. Check Existing User (Database) ---
  const existingUserError = await _checkExistingPrismaUser(
    log,
    logContext,
    validatedData.email,
    db
  );
  if (existingUserError) {
    return existingUserError;
  }

  // --- 5. Perform Core Registration and Sign-in Attempt ---
  log.debug(logContext, 'Proceeding to core registration attempt...');
  const registrationAttemptResult = await _performRegistrationAttempt(
    validatedData,
    { db, hasher, fbService },
    logContext
  );

  // _performRegistrationAttempt returns null on complete success (including sign-in)
  // or a ServiceResponse object on any failure (Firebase create, Prisma create + rollback, sign-in fail)
  if (registrationAttemptResult) {
    // If it returned an error response, just return that directly.
    // Logging is handled within _performRegistrationAttempt or _handleMainRegistrationError
    return registrationAttemptResult;
  }

  // --- 6. Handle Success ---
  // If registrationAttemptResult is null, it means everything succeeded.
  log.info(logContext, 'Registration and post-registration sign-in successful.');
  return {
    status: 'success',
    message: 'User registered successfully. Redirecting...',
    data: null, // No data needed for this success response
  };
}

// --- Public Server Action --- //

/**
 * Server Action for user registration.
 * Handles form data submission, calls the core registration logic, and returns a ServiceResponse.
 */
export async function registerUserAction(
  _prevState: ServiceResponse<null, unknown> | null, // Previous state (unused but required by useFormState)
  formData: FormData
): Promise<ServiceResponse<null, unknown>> {
  // We directly call registerUserLogic which now contains all the checks.
  // The dependencies (logger, db, fbService, hasher) will use defaults unless overridden for testing.
  return registerUserLogic(formData);
}

// Keep authenticateWithCredentials commented out as it was removed/refactored previously.
/*
export async function authenticateWithCredentials(
  formData: FormData,
): Promise<{ message: string }> {
  const log = actionLogger.child({ action: 'authenticateWithCredentials' });
  log.info('Attempting credentials authentication...');

  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    log.warn('Missing email or password.');
    return { message: 'Email and password are required.' };
  }

  const logContext = { email }; // Use email for context

  try {
    // Use signIn from auth-node configured with CredentialsProvider
    await signIn('credentials', { email, password, redirect: false }); // Explicitly false
    log.info(logContext, 'Credentials sign-in successful (signIn resolved).');
    // If signIn resolves without throwing (and redirect is false), it was successful.
    // The redirect itself will be handled client-side or by middleware based on session state.
    // Return a success indicator. It might not be strictly necessary if redirects handle flow.
    return { message: 'Login successful (pending redirect).' };
  } catch (error: unknown) {
    // Handle errors thrown by signIn (e.g., NextAuth specific errors)
    log.warn({ ...logContext, error }, 'Credentials sign-in failed (signIn threw).');

    // Use the specific error handling logic for NextAuth errors
    if (error instanceof Error) {
        // Check if it's a known NextAuth error type
        const errorType = (error as any).type ?? error.name;
        return _handleNextAuthErrorType(errorType, error, log, logContext);
    }

    // Fallback for non-Error objects or unknown errors
    log.error({ ...logContext, error }, 'Unexpected non-Error object caught during credentials sign-in.');
    return { message: 'An unexpected error occurred during login.' };
  }
}

// Helper to translate NextAuth error types/names into user-friendly messages
function _handleNextAuthErrorType(
    errorType: string,
    error: Error, // The original error object
    log: pino.Logger,
    logContext: object
): { message: string } {
    log.debug({ ...logContext, errorType, errorName: error.name }, 'Handling NextAuth error type');
    switch (errorType) {
        case 'CredentialsSignin':
        case 'InvalidCredentials': // Handle potential variations
            log.warn({ ...logContext }, 'CredentialsSignin error occurred.');
            return { message: 'Invalid email or password.' };
        case 'CallbackRouteError':
            // Log the underlying cause if available
            const cause = (error as any).cause?.err?.message || 'Unknown reason';
            log.warn({ ...logContext, cause }, 'CallbackRouteError occurred.');
            return { message: `Login failed: ${cause}` };
        // Add other specific NextAuth error types here if needed
        // https://errors.authjs.dev/
        default:
            log.error({ ...logContext, errorType, errorName: error.name }, 'Unhandled NextAuth error type during credentials sign-in.');
            return { message: 'An authentication error occurred. Please try again.' };
    }
}
*/
