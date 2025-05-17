'use server'; // Restore directive

/* eslint-disable max-lines -- Disabled: This file contains multiple related server actions 
   (registration, credentials auth) and their associated helper functions. 
   Significant refactoring has already been done to break down logic internally. 
   Further splitting might reduce clarity and cohesion more than the length limit warrants. */

import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import type { Prisma } from '@prisma/client'; // Ensured Prisma namespace is imported
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
  log: PinoLogger; // Added logger
}

// Interface for optional dependencies passed into the main action logic
interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  fbService?: FirebaseAdminService;
  logger?: PinoLogger; // Use imported type
}

// Interface for the options parameter of _runRegistrationPreChecks
interface PreCheckOptions {
  log: PinoLogger;
  db: RegisterUserDbClient;
  initialLogContext?: { email?: string }; // Optional initial log context from caller
}

// --- Private Helper Functions --- //

// Helper function to prepare data for Prisma user creation
function _preparePrismaUserData(
  firebaseUser: admin.auth.UserRecord,
  hashedPassword: string
): Prisma.UserCreateInput {
  if (!firebaseUser.email) {
    // This case should ideally be caught by the caller of _createPrismaUser,
    // but as a safeguard or if used elsewhere.
    actionLogger.error(
      { uid: firebaseUser.uid },
      '_preparePrismaUserData: Firebase user record unexpectedly missing email.'
    );
    throw new Error('Firebase user record missing email for Prisma data preparation.');
  }
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName,
    email: firebaseUser.email,
    hashedPassword,
    emailVerified: firebaseUser.emailVerified ? new Date() : null,
  };
}

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

/**
 * Creates a user in Prisma, linking to an existing Firebase user if an ID is provided.
 */
// eslint-disable-next-line max-statements -- Handles critical creation step with necessary error handling and rollback logic, statement count is slightly over due to this.
async function _createPrismaUser(
  firebaseUser: admin.auth.UserRecord,
  passwordToHash: string,
  services: { db: RegisterUserDbClient; hasher: Hasher; fbService: FirebaseAdminService },
  logContext: { email?: string | null; uid?: string },
  tx?: Prisma.TransactionClient // Added optional transaction client
): Promise<User | RegistrationResult> {
  const { db, hasher, fbService } = services;
  // Use transaction client if provided for Prisma operations, else use the default db client from services
  const prismaOps = tx || db;
  actionLogger.debug(logContext, '_createPrismaUser: Starting Prisma user creation process...');

  const email = firebaseUser.email;
  if (!email) {
    actionLogger.error(
      { ...logContext, uid: firebaseUser.uid },
      '_createPrismaUser: Firebase user record unexpectedly missing email.'
    );
    // This should ideally be caught by the caller, but throwing here prevents further processing.
    throw new Error('Firebase user record missing email during Prisma user creation.');
  }
  const logContextBase = {
    email: email, // Now guaranteed to be a string
    uid: firebaseUser.uid,
  };

  actionLogger.debug(logContextBase, '_createPrismaUser: Hashing password...');
  const hashedPassword = await hasher.hash(passwordToHash, SALT_ROUNDS);

  actionLogger.debug(logContextBase, '_createPrismaUser: Preparing Prisma user data...');
  const prismaUserData = _preparePrismaUserData(firebaseUser, hashedPassword);

  actionLogger.debug(logContextBase, '_createPrismaUser: Attempting DB create...');
  try {
    const prismaUser = await prismaOps.user.create({ data: prismaUserData });
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
    const rollbackErrorInstance = await _handlePrismaCreateFailure(
      firebaseUser,
      fbService,
      logContextBase,
      dbError
    );
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

// Helper to process RollbackError instances for _handleMainRegistrationError
function _processRollbackError(
  error: RollbackError,
  logContextForWarning: object // Re-use logContext from caller or pass relevant parts
): { errorCode: string; errorMessage: string; errorDetails: RegistrationErrorDetails } {
  actionLogger.warn(
    { ...logContextForWarning, originalDbError: error.originalError }, // Log context passed here
    `Registration failed: ${error.message}`
  );
  let errorCode: string;
  if (error.message.includes('rollback FAILED')) {
    errorCode = 'REGISTRATION_DB_FAILURE_ROLLBACK_FAILURE';
  } else {
    errorCode = 'REGISTRATION_DB_FAILURE_ROLLBACK_SUCCESS';
  }
  return {
    errorCode,
    errorMessage: error.message,
    errorDetails: { originalError: error.originalError },
  };
}

/**
 * Handles and logs errors occurring during the main registration process (Firebase/Prisma user creation).
 */
async function _handleMainRegistrationError(
  error: unknown, // This will be the 'wrappedError' from the caller
  context: string,
  _log?: PinoLogger
): Promise<RegistrationResult> {
  // --- RESTORED INTENDED PRODUCTION LOGIC ---
  const logContext = {
    error,
    registrationContext: context,
    originalErrorType: (error as any)?.originalErrorType, // Log if present from wrappedError
  };
  actionLogger.error(
    logContext,
    '_handleMainRegistrationError: Caught error during registration attempt.'
  );

  let errorCode = 'UNKNOWN_REGISTRATION_ERROR';
  let errorMessage = 'An unexpected error occurred during registration.';
  // Ensure originalError in details is a string representation for better serializability
  let errorDetails: RegistrationErrorDetails = {
    originalError: error instanceof Error ? error.message : String(error),
  };

  if (error instanceof RollbackError) {
    const processedRollback = _processRollbackError(error, logContext);
    errorCode = processedRollback.errorCode;
    errorMessage = processedRollback.errorMessage;
    // Ensure errorDetails from _processRollbackError also has stringified originalError
    errorDetails = processedRollback.errorDetails;
    if (typeof errorDetails.originalError !== 'string') {
      errorDetails.originalError = String(
        errorDetails.originalError || 'RollbackError original error missing or not stringifiable'
      );
    }
  } else {
    // For other errors (like our wrappedError), use _translateRegistrationError
    const translated = _translateRegistrationError(error);
    errorMessage = translated.message;
    errorCode = translated.code;
    // errorDetails.originalError was already set from the incoming 'error' (wrappedError)
    // No need to reset it here unless translated offers more specific primitive details
    // For now, the initial stringified wrappedError.message is sufficient.
  }

  // If the error (or originalError in RollbackError) was a ZodError, add validation details
  const potentialZodError = error instanceof RollbackError ? error.originalError : error;
  if (potentialZodError instanceof z.ZodError) {
    errorDetails.validationErrors = potentialZodError.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    // If it was a ZodError and not a RollbackError, its message is likely best for originalError
    if (!(error instanceof RollbackError)) {
      errorDetails.originalError = potentialZodError.message;
    }
  }

  return {
    status: 'error',
    message: errorMessage,
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails, // Contains stringified originalError and optional validationErrors
    },
  };
  // --- END RESTORED INTENDED PRODUCTION LOGIC ---
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

/**
 * Executes the rate-limiting pipeline using Redis.
 */
// eslint-disable-next-line max-statements -- Function implements a specific Redis pipeline for rate limiting with detailed error checking for each step; keeping related commands together improves understanding.
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

/**
 * Checks if the registration attempt from a given IP or for a given user identifier is rate-limited.
 */
// eslint-disable-next-line max-statements -- Function performs several sequential checks to determine rate limit status, including handling of Redis client availability and pipeline errors.
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

// New helper function to encapsulate Prisma user creation and sign-in attempt
async function _createPrismaUserAndAttemptSignIn(
  firebaseUser: admin.auth.UserRecord,
  validatedData: RegistrationInput, // For password and email
  services: PerformRegistrationDeps,
  logContext: { email: string; uid: string } // Include UID from firebaseUser
): Promise<RegistrationResult | null> {
  actionLogger.debug(
    logContext,
    '_createPrismaUserAndAttemptSignIn: Beginning process to create Prisma user and then attempt sign-in.'
  );
  const { log } = services; // Destructure services, removed unused db and hasher

  // --- 1. Create Prisma User ---
  actionLogger.debug(logContext, '_createPrismaUserAndAttemptSignIn: Attempting Prisma user creation...');

  let createdPrismaUser: User | null = null;

  // Step 1: Create Prisma User (within its own transaction)
  actionLogger.debug(
    logContext,
    '_createPrismaUserAndAttemptSignIn: Beginning Prisma user creation transaction...'
  );
  try {
    const prismaUserResult = await prisma.$transaction(async tx => {
      actionLogger.debug(
        logContext,
        '_createPrismaUserAndAttemptSignIn: Inside transaction - creating Prisma user...'
      );
      const user = await _createPrismaUser(
        firebaseUser,
        validatedData.password,
        { ...services, db: tx as unknown as RegisterUserDbClient }, // Pass transaction client correctly typed
        logContext,
        tx // Pass the transaction client also here, though _createPrismaUser primarily uses services.db
      );

      if (!user || !('id' in user)) {
        actionLogger.warn(
          logContext,
          '_createPrismaUserAndAttemptSignIn: _createPrismaUser did not return a valid user object. Will throw to rollback Prisma transaction.'
        );
        const errorToThrow = new RollbackError(
          'Prisma user creation failed or returned error structure inside transaction.',
          (user as RegistrationResult)?.error?.details?.originalError ||
          new Error('Prisma user creation failed within transaction.')
        );
        throw errorToThrow;
      }
      return user as User; // Explicitly type as User
    });

    createdPrismaUser = prismaUserResult; // Assign if transaction succeeded
    actionLogger.info(
      { ...logContext, userId: createdPrismaUser.id },
      '_createPrismaUserAndAttemptSignIn: Prisma user creation transaction Succeeded.'
    );
  } catch (error: unknown) {
    actionLogger.error(
      { ...logContext, error },
      '_createPrismaUserAndAttemptSignIn: Prisma user creation transaction failed or was rolled back.'
    );
    // If Prisma creation fails, Firebase user should have been rolled back by _createPrismaUser -> _handlePrismaCreateFailure
    // So, we just return the error from that process.
    if (error instanceof RollbackError) {
      return _handleMainRegistrationError(
        error,
        'prisma creation transaction rollback with RollbackError'
      );
    }
    return _handleMainRegistrationError(error, 'prisma creation transaction');
  }

  // If createdPrismaUser is null here, it means Prisma creation failed and returned.
  if (!createdPrismaUser) {
    // This case should be covered by the catch block above, but as a safeguard:
    actionLogger.error(
      logContext,
      '_createPrismaUserAndAttemptSignIn: Prisma user is null after creation block, implies failure.'
    );
    return {
      status: 'error',
      message: 'Failed to create user record in database.',
      error: {
        code: 'PRISMA_USER_CREATION_FAILED_UNEXPECTED',
        message: 'Prisma user null post-transaction.',
      },
    };
  }

  // --- 2. Attempt Post-Registration Sign-In (now that Prisma user is committed) ---
  actionLogger.debug(
    { ...logContext, userId: createdPrismaUser.id },
    '_createPrismaUserAndAttemptSignIn: Attempting post-registration sign-in...'
  );

  const signInResult = await _attemptPostRegistrationSignIn(
    createdPrismaUser.email as string, // Ensure email is string
    validatedData.password,
    log,
    {
      userId: createdPrismaUser.id,
      email: createdPrismaUser.email as string, // Ensure email is string
      name: createdPrismaUser.name,
    }
  );

  if (signInResult && signInResult.status === 'error') {
    actionLogger.warn(
      { ...logContext, userId: createdPrismaUser.id, error: signInResult.error },
      '_createPrismaUserAndAttemptSignIn: Post-registration sign-in failed. Prisma user ALREADY COMMITTED.'
    );
    // Return the signInResult directly, as Prisma user is already created and committed.
    // The UI will show "Registration successful, please sign in."
    return signInResult;
  }

  actionLogger.info(
    { ...logContext, userId: createdPrismaUser.id },
    '_createPrismaUserAndAttemptSignIn: Post-registration sign-in successful.'
  );
  return null; // Overall success
}

// Helper to attempt manual Firebase rollback in _performRegistrationAttempt catch block
async function _attemptManualFirebaseRollbackOnError(
  firebaseUser: admin.auth.UserRecord | undefined,
  triggeringError: unknown, // The error that triggered this path
  fbService: FirebaseAdminService,
  baseLogContext: { email: string } // Base log context from the caller
): Promise<void> {
  // Returns void, only logs
  if (firebaseUser && !(triggeringError instanceof RollbackError)) {
    const logContext = { ...baseLogContext, uid: firebaseUser.uid, triggeringError };
    actionLogger.warn(
      logContext,
      '_attemptManualFirebaseRollbackOnError: Unexpected error after Firebase user creation. Attempting manual rollback.'
    );
    try {
      await fbService.deleteUser(firebaseUser.uid);
      actionLogger.info(
        { ...logContext, uid: firebaseUser.uid }, // Re-specify uid for this specific log point if needed, or rely on spread
        '_attemptManualFirebaseRollbackOnError: Manual Firebase user rollback successful.'
      );
    } catch (rollbackError) {
      actionLogger.error(
        { ...logContext, uid: firebaseUser.uid, rollbackError }, // Include rollbackError here
        '_attemptManualFirebaseRollbackOnError: Manual Firebase user rollback FAILED.'
      );
    }
  }
}

/**
 * Core logic for a single registration attempt, including DB interaction and Firebase sync.
 */
async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: { email: string }
): Promise<RegistrationResult | null> {
  actionLogger.debug(logContext, '_performRegistrationAttempt: Starting registration attempt...');
  const { fbService } = services; // Removed unused log, db and hasher

  let firebaseUser: admin.auth.UserRecord | undefined;

  try {
    actionLogger.debug(logContext, '_performRegistrationAttempt: Attempting to create Firebase user...');
    firebaseUser = await _createFirebaseUser(
      {
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
      },
      fbService,
      logContext
    );
    actionLogger.info(
      { ...logContext, uid: firebaseUser.uid },
      '_performRegistrationAttempt: Firebase user created successfully.'
    );

    const logContextWithUid = { ...logContext, uid: firebaseUser.uid };

    const prismaSignInResult = await _createPrismaUserAndAttemptSignIn(
      firebaseUser,
      validatedData, // Contains password for sign-in attempt
      services,
      logContextWithUid
    );

    if (prismaSignInResult?.status === 'error') {
      actionLogger.warn(
        logContextWithUid,
        '_performRegistrationAttempt: Prisma user creation or post-reg sign-in failed. Attempting Firebase rollback.'
      );
      await _attemptManualFirebaseRollbackOnError(
        firebaseUser,
        prismaSignInResult, // Pass the error result as the triggering error
        services.fbService, // Pass fbService from services
        logContextWithUid // Restore: Use logContextWithUid which contains both email and uid
      );
      return prismaSignInResult; // Return the error from Prisma/sign-in stage
    }

    // If prismaSignInResult is null or not an error, registration is considered successful at this point
    actionLogger.info(
      logContextWithUid,
      '_performRegistrationAttempt: Registration and post-reg sign-in successful.'
    );
    return { status: 'success', message: 'Registration successful', data: null };
  } catch (error) {
    actionLogger.error(
      {
        ...logContext,
        email: validatedData.email,
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      'DEBUG_PERFORM_REG_ATTEMPT_CATCH: Entered catch block in _performRegistrationAttempt.'
    );
    const errorDetailsForLogging = {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'N/A',
      errorStack: error instanceof Error ? error.stack : 'N/A',
      errorCause: error instanceof Error && error.cause ? error.cause : 'N/A',
    };
    actionLogger.error(
      { ...logContext, email: validatedData.email, ...errorDetailsForLogging },
      'Error during core registration attempt (Firebase/Prisma) - details logged separately if possible.'
    );

    if (firebaseUser?.uid) {
      await _attemptManualFirebaseRollbackOnError(
        firebaseUser,
        error,
        services.fbService, // Ensure fbService is passed correctly from services
        logContext // Fix: Use logContext which is in scope, not logContextWithUid
      );
    }

    // Safely construct wrappedError for _handleMainRegistrationError
    let wrappedErrorMessage = 'Unknown error during registration attempt';
    if (error instanceof Error) {
      wrappedErrorMessage = error.message;
    } else if (typeof error === 'string') {
      wrappedErrorMessage = error;
    } else {
      try {
        wrappedErrorMessage = String(error);
      } catch (e) {
        /* Fallback to default */
      }
    }
    // const wrappedError = new Error(`Core registration error: ${wrappedErrorMessage}`);
    // if (error instanceof Error && error.stack) {
    //   wrappedError.stack = error.stack; // Preserve stack if available
    // }
    // let originalErrorType = 'unknown';
    // if (error && typeof error === 'object' && error.constructor && typeof error.constructor.name === 'string') {
    //   originalErrorType = error.constructor.name;
    // } else {
    //   originalErrorType = typeof error;
    // }
    // (wrappedError as any).originalErrorType = originalErrorType;

    // --- SIMPLIFIED ERROR FOR DEBUGGING ---
    const simplifiedErrorForDebug = new Error(wrappedErrorMessage); // Just use the message

    // Return the result from the (now restored) _handleMainRegistrationError
    // return _handleMainRegistrationError(wrappedError, 'core_registration_error');
    return _handleMainRegistrationError(
      simplifiedErrorForDebug,
      'core_registration_error_simplified_debug'
    );
  }
}

// Helper function to resolve dependencies
interface ResolvedRegisterDeps {
  log: PinoLogger; // Use imported type
  fbService: FirebaseAdminService | undefined; // Allow undefined here
  db: RegisterUserDbClient;
  hasher: Hasher;
}

function _resolveRegisterDependencies(deps?: RegisterUserOptionalDeps): ResolvedRegisterDeps {
  const defaultLog = actionLogger.child({ function: '_resolveRegisterDependencies' });
  const resolvedLogger = deps?.logger || defaultLog;

  // Ensure FirebaseAdminService is initialized using getFirebaseAdminAuth()
  // which handles the singleton correctly.
  const fbServiceInstance = deps?.fbService || firebaseAdminService; // Uses the global singleton

  return {
    log: resolvedLogger,
    fbService: fbServiceInstance, // Can be undefined if deps.fbService was explicitly null/undefined
    db: deps?.db || prisma,
    hasher: deps?.hasher || { hash },
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

// Helper to validate FormData and prepare RegistrationInput for _runRegistrationPreChecks
async function _validateAndPrepareInputData(
  formData: FormData,
  initialLogContext: { email?: string } | undefined,
  log: PinoLogger
): Promise<{ validatedData?: RegistrationInput; errorResult?: RegistrationResult }> {
  log.debug(
    initialLogContext,
    '_validateAndPrepareInputData: Received FormData, performing validation.'
  );
  const validationResult = await _validateRegistrationInput(formData);

  if (!validationResult.success) {
    const validationErrors = validationResult.error.flatten().fieldErrors;
    log.warn(
      { ...initialLogContext, validationErrors },
      '_validateAndPrepareInputData: Input validation failed.'
    );
    return {
      errorResult: {
        status: 'error',
        message: 'Invalid input.',
        error: {
          code: 'ValidationError',
          message: 'Invalid input.',
          details: { validationErrors },
        },
      },
    };
  }
  const validatedData = validationResult.data;
  log.debug(
    { ...initialLogContext, email: validatedData.email },
    '_validateAndPrepareInputData: FormData validation successful.'
  );
  return { validatedData };
}

// Runs pre-checks before attempting user registration (rate limiting, existing user).
// eslint-disable-next-line max-statements, max-lines-per-function
async function _runRegistrationPreChecks(
  formDataOrValidatedData: FormData | RegistrationInput,
  options: PreCheckOptions
): Promise<{ validatedData?: RegistrationInput; errorResult?: RegistrationResult }> {
  const { log, db, initialLogContext } = options;
  let validatedData: RegistrationInput;

  if (formDataOrValidatedData instanceof FormData) {
    const validationOutcome = await _validateAndPrepareInputData(
      formDataOrValidatedData,
      initialLogContext,
      log
    );
    if (validationOutcome.errorResult) {
      return { errorResult: validationOutcome.errorResult };
    }
    if (!validationOutcome.validatedData) {
      log.error(
        initialLogContext,
        '_runRegistrationPreChecks: _validateAndPrepareInputData returned no error but no validatedData. Internal logic error.'
      );
      return {
        errorResult: await _handleMainRegistrationError(
          new Error('Internal error during input validation processing.'),
          'internal_validation_processing_error'
        ),
      };
    }
    validatedData = validationOutcome.validatedData;
  } else {
    validatedData = formDataOrValidatedData;
    log.debug(
      { ...initialLogContext, email: validatedData.email },
      '_runRegistrationPreChecks: Received pre-validated RegistrationInput.'
    );
  }

  const currentLogContext = { ...initialLogContext, email: validatedData.email };

  const clientIp = await getClientIp();

  // 2. Rate Limiting
  const rateLimitError = await _handleRegistrationRateLimit(log, currentLogContext, clientIp);
  if (rateLimitError) {
    return { errorResult: rateLimitError };
  }

  // 3. Check Existing User (Database)
  const existingUserError = await _checkExistingPrismaUser(
    log,
    currentLogContext,
    validatedData.email,
    db
  );
  if (existingUserError) {
    return { errorResult: existingUserError };
  }

  log.debug(currentLogContext, '_runRegistrationPreChecks: All pre-checks passed.');
  return { validatedData }; // All checks passed, return validated data
}

/**
 * Main logic for user registration, handling data validation, rate limiting, user creation, and sign-in.
 * This function is designed to be called from a Server Action.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- This is the main internal orchestrator for the registration process, coordinating various checks and operations. Its length and statement count are slightly over due to this central role.
async function registerUserLogic(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData | RegistrationInput,
  deps?: RegisterUserOptionalDeps
): Promise<ServiceResponse<null, unknown>> {
  const { log, fbService, db, hasher } = _resolveRegisterDependencies(deps);
  const initialLogContextForLogic = {
    email: formData instanceof FormData ? (formData.get('email') as string) : formData.email,
  };
  log.info(initialLogContextForLogic, 'registerUserLogic: Starting registration process...');

  // REMOVED DEBUG TRY-CATCH WRAPPER - RESTORING ORIGINAL FLOW
  if (!fbService) {
    log.warn(
      initialLogContextForLogic,
      'registerUserLogic: Firebase Admin Service is not available. Registration cannot proceed.'
    );
    return {
      status: 'error',
      message: 'Registration service unavailable. Please try again later.',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Firebase Admin Service not initialized.',
      },
    } as ServiceResponse<null, unknown>;
  }

  const { validatedData, errorResult: preCheckError } = await _runRegistrationPreChecks(formData, {
    log,
    db,
    initialLogContext: initialLogContextForLogic,
  });

  if (preCheckError) {
    log.warn(
      { ...initialLogContextForLogic, errorCode: preCheckError.error?.code },
      'registerUserLogic: Pre-checks failed.'
    );
    return preCheckError as ServiceResponse<null, unknown>;
  }

  if (!validatedData) {
    log.error(
      initialLogContextForLogic,
      'registerUserLogic: Validated data is unexpectedly undefined after pre-checks without error.'
    );
    return {
      status: 'error',
      message: 'An unexpected error occurred during input validation.',
      error: {
        code: 'INTERNAL_VALIDATION_ERROR',
        message: 'Validated data missing post pre-checks.',
      },
    } as ServiceResponse<null, unknown>;
  }

  const logContextWithValidatedEmail = { email: validatedData.email };

  const registrationAttemptResult = await _performRegistrationAttempt(
    validatedData,
    { log, fbService, db, hasher },
    logContextWithValidatedEmail
  );

  if (registrationAttemptResult?.status === 'error') {
    log.warn(
      { ...logContextWithValidatedEmail, errorCode: registrationAttemptResult.error?.code },
      'registerUserLogic: Registration attempt resulted in an error status (returned from attempt).'
    );
    return registrationAttemptResult as ServiceResponse<null, unknown>;
  }

  if (registrationAttemptResult?.status === 'success') {
    log.info(
      logContextWithValidatedEmail,
      'registerUserLogic: Registration process completed successfully.'
    );
    return { status: 'success', message: 'Registration successful', data: null };
  }

  log.error(
    logContextWithValidatedEmail,
    'registerUserLogic: Registration attempt returned an unexpected result structure.'
  );
  return {
    status: 'error',
    message: 'An unexpected outcome occurred during registration.',
    error: {
      code: 'UNKNOWN_REGISTRATION_OUTCOME',
      message: 'Unexpected result from registration attempt.',
    },
  } as ServiceResponse<null, unknown>;
  // END OF ORIGINAL registerUserLogic BODY (before any debug catch was added)
}

// --- Public Server Action --- //

/**
 * Server Action for user registration with form data.
 * This is the entry point for the registration form.
 */
export async function registerUserAction(
  _prevState: ServiceResponse<null, unknown> | null, // Previous state (unused but required by useFormState)
  formData: FormData
): Promise<ServiceResponse<null, unknown>> {
  // We directly call registerUserLogic which now contains all the checks.
  // The dependencies (logger, db, fbService, hasher) will use defaults unless overridden for testing.
  return registerUserLogic(null, formData);
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
    return { message: 'An authentication error occurred. Please try again.' };
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

async function _attemptPostRegistrationSignIn(
  email: string,
  passwordAttempt: string,
  log: PinoLogger,
  postRegistrationData?: { userId: string; email: string; name: string | null }
): Promise<RegistrationResult | null> {
  const logContext = {
    email,
    operation: '_attemptPostRegistrationSignIn',
    ...(postRegistrationData && { postRegUserId: postRegistrationData.userId }),
  };
  log.debug(logContext, 'Attempting post-registration sign-in...');

  try {
    const signInResult = await signIn('credentials', {
      email,
      password: passwordAttempt,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    log.info(
      { ...logContext, success: signInResult?.ok || false, signInResult },
      'Post-registration sign-in attempt completed'
    );

    if (signInResult?.ok || (signInResult && !signInResult.error)) {
      log.info(
        { ...logContext, signInResultStatus: signInResult?.status },
        'Post-registration sign-in successful based on signInResult inspection'
      );
      return null; // Success
    }

    log.warn(
      {
        ...logContext,
        signInError: 'Sign-in part failed',
        status: signInResult?.status,
        error: signInResult?.error,
      },
      'Registration successful but automatic sign-in failed'
    );
    return {
      status: 'error',
      message: 'Registration successful but automatic sign-in failed. Please sign in manually.',
      error: {
        code: 'AUTO_SIGNIN_FAILED',
        message: 'Registration successful but automatic sign-in failed.',
        details: {
          originalError: signInResult?.error || 'Unknown sign-in error',
        },
      },
    };
  } catch (error) {
    log.error({ ...logContext, error }, 'Error during automatic post-registration sign-in');
    return {
      status: 'error',
      message: 'Registration successful! Please sign in with your new account.',
      error: {
        code: 'AUTO_SIGNIN_EXCEPTION',
        message: 'Exception during automatic sign-in after registration.',
        details: {
          originalError: error,
        },
      },
    };
  }
}
