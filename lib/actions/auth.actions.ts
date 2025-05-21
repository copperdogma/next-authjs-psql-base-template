'use server'; // Restore directive

/* eslint-disable max-lines -- Disabled: This file contains multiple related server actions 
   (registration, credentials auth) and their associated helper functions. 
   Significant refactoring has already been done to break down logic internally. 
   Further splitting might reduce clarity and cohesion more than the length limit warrants. */

import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import * as admin from 'firebase-admin';
import type { Logger } from 'pino';
// import type { Session } from 'next-auth'; // Removed unused import

import { logger as rootLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getFirebaseAdminService } from '@/lib/server/services';
import { signIn } from '@/lib/auth-node';
import type { ServiceResponse } from '@/types';
import { type Redis } from 'ioredis';
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import {
  _translateFirebaseAuthError,
  _translatePrismaError,
  _translateGenericError,
  RollbackError,
} from './auth-error-helpers';
import { getOptionalRedisClient } from '@/lib/redis';
import { getClientIp } from '@/lib/utils/server-utils';
import { env } from '@/lib/env';
import { isObject, isValidUserResult } from '../utils/type-guards';

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
interface LogContext {
  source?: string;
  email?: string | null;
  uid?: string;
  clientIp?: string | null;
  [key: string]: unknown; // Changed from any to unknown for stricter typing
}

interface RegisterUserDbClient {
  user: {
    findUnique: typeof prisma.user.findUnique;
    create: typeof prisma.user.create;
  };
}

interface Hasher {
  hash: (password: string, saltOrRounds: number) => Promise<string>;
}

interface RegistrationErrorDetails {
  originalError?: unknown;
  validationErrors?: Record<string, string[]>;
}

type RegistrationResult = ServiceResponse<null, RegistrationErrorDetails>;

interface PerformRegistrationDeps {
  db: RegisterUserDbClient;
  hasher: Hasher;
  fbService: FirebaseAdminService;
  log: Logger;
}

interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  fbService?: FirebaseAdminService;
  logger?: Logger;
}

interface PreCheckOptions {
  log: Logger;
  db: RegisterUserDbClient;
  initialLogContext?: LogContext;
}

interface CreatePrismaUserOptions {
  logContext: LogContext;
  tx?: Prisma.TransactionClient;
}

// --- Private Helper Functions --- //

function _preparePrismaUserData(
  firebaseUser: admin.auth.UserRecord,
  hashedPassword: string
): Prisma.UserCreateInput {
  if (!firebaseUser.email) {
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
  logContext: LogContext
): Promise<admin.auth.UserRecord> {
  actionLogger.debug(logContext, '_createFirebaseUser: Attempting...');
  try {
    const firebaseUser = await fbService.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name ?? undefined,
    });
    actionLogger.info({ ...logContext, uid: firebaseUser.uid }, '_createFirebaseUser: Success');
    return firebaseUser;
  } catch (error) {
    actionLogger.error(
      {
        ...logContext,
        error,
        isErrorInstance: error instanceof Error,
        errorStringified: JSON.stringify(error, Object.getOwnPropertyNames(error)), // More robust stringify
      },
      '_createFirebaseUser: FAILED'
    );
    throw error;
  }
}

async function _handlePrismaCreateErrorAndRollback(
  dbError: unknown,
  firebaseUser: admin.auth.UserRecord,
  fbService: FirebaseAdminService,
  baseLogContext: LogContext // Reverted to baseLogContext for clarity as email/uid are already in it
): Promise<RegistrationResult> {
  actionLogger.warn(
    { ...baseLogContext, error: dbError },
    '_handlePrismaCreateErrorAndRollback: Prisma create failed. Initiating rollback.'
  );
  const rollbackErrorInstance = await _handlePrismaCreateFailure(
    firebaseUser,
    fbService,
    baseLogContext,
    dbError
  );
  actionLogger.debug(
    { ...baseLogContext, rollbackErrorInstance },
    '_handlePrismaCreateErrorAndRollback: Returning error response via _handleMainRegistrationError.'
  );
  return _handleMainRegistrationError(rollbackErrorInstance, 'prisma creation/rollback');
}

async function _createPrismaUser(
  firebaseUser: admin.auth.UserRecord,
  passwordToHash: string,
  services: {
    db: RegisterUserDbClient;
    hasher: Hasher;
    fbService: FirebaseAdminService;
    log: Logger;
  },
  options: CreatePrismaUserOptions
): Promise<User | RegistrationResult> {
  const { db, hasher, fbService, log: _log } = services;
  const { logContext, tx } = options;
  const prismaOps = tx || db;
  const email = firebaseUser.email;

  if (!email) {
    actionLogger.error(
      { ...logContext, uid: firebaseUser.uid },
      '_createPrismaUser: Firebase user record unexpectedly missing email.'
    );
    throw new Error('Firebase user record missing email during Prisma user creation.');
  }
  const baseLogContext = { ...logContext, email, uid: firebaseUser.uid };

  actionLogger.debug(
    baseLogContext,
    '_createPrismaUser: Attempting DB create. Hashing password & preparing data as part of create operation...'
  );
  try {
    const prismaUser = await prismaOps.user.create({
      data: _preparePrismaUserData(firebaseUser, await hasher.hash(passwordToHash, SALT_ROUNDS)),
    });
    actionLogger.debug(
      { ...baseLogContext, userId: prismaUser.id },
      '_createPrismaUser: DB create success'
    );
    return prismaUser;
  } catch (dbError) {
    return _handlePrismaCreateErrorAndRollback(dbError, firebaseUser, fbService, baseLogContext);
  }
}

async function _handlePrismaCreateFailure(
  firebaseUser: admin.auth.UserRecord,
  fbService: FirebaseAdminService,
  baseLogContext: LogContext,
  originalDbError: unknown
): Promise<RollbackError> {
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
    return new RollbackError(
      'Database user creation failed AND Firebase user rollback FAILED.',
      originalDbError
    );
  }
}

function _processRollbackError(
  error: RollbackError,
  logContextForWarning: object
): { errorCode: string; errorMessage: string; errorDetails: RegistrationErrorDetails } {
  actionLogger.warn(
    { ...logContextForWarning, originalDbError: error.originalError },
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

interface ProcessedErrorInfo {
  code: string;
  message: string;
  originalErrorForDetails: unknown;
}

function _determineErrorTypeAndTranslate(
  error: unknown,
  context: string,
  initialLogContextForRollback: object // Only for RollbackError's call to _processRollbackError
): ProcessedErrorInfo {
  if (error instanceof RollbackError) {
    const processedRollback = _processRollbackError(error, initialLogContextForRollback);
    return {
      code: processedRollback.errorCode,
      message: processedRollback.errorMessage,
      originalErrorForDetails: processedRollback.errorDetails.originalError,
    };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    actionLogger.warn(
      { prismaErrorCode: error.code, context, error },
      'Prisma known request error'
    );
    const translated = _translatePrismaError(error);
    return { code: translated.code, message: translated.message, originalErrorForDetails: error };
  }
  // Firebase error check
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('auth/')
  ) {
    actionLogger.warn(
      { firebaseErrorCode: (error as { code: string }).code, context, error },
      'Firebase Auth error'
    );
    const translated = _translateFirebaseAuthError(error as admin.FirebaseError);
    return { code: translated.code, message: translated.message, originalErrorForDetails: error };
  }
  // Generic error
  actionLogger.error({ error, context }, 'Generic or unknown error during registration');
  const translated = _translateGenericError(
    error instanceof Error ? error : new Error(String(error))
  );
  return { code: translated.code, message: translated.message, originalErrorForDetails: error };
}

async function _handleMainRegistrationError(
  error: unknown,
  context: string,
  _log?: Logger
): Promise<RegistrationResult> {
  const initialLogContext = {
    error,
    registrationContext: context,
  };
  actionLogger.error(
    initialLogContext,
    '_handleMainRegistrationError: Caught error during registration attempt.'
  );

  const {
    code: errorCodeFromHelper,
    message: errorMessageFromHelper,
    originalErrorForDetails,
  } = _determineErrorTypeAndTranslate(error, context, initialLogContext);

  let errorDetails: RegistrationErrorDetails = {
    originalError: originalErrorForDetails,
  };

  // Special handling for RollbackError's originalError stringification & ZodError processing
  const potentialZodError = error instanceof RollbackError ? error.originalError : error;

  if (error instanceof RollbackError && typeof errorDetails.originalError !== 'string') {
    errorDetails.originalError = String(
      errorDetails.originalError || 'RollbackError original error missing or not stringifiable'
    );
  }

  if (potentialZodError instanceof z.ZodError) {
    errorDetails.validationErrors = potentialZodError.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    // If it's a ZodError and not primarily a RollbackError, its message might be more relevant for originalError
    if (!(error instanceof RollbackError)) {
      errorDetails.originalError = potentialZodError.message;
    }
  }

  return {
    status: 'error',
    message: errorMessageFromHelper,
    error: {
      code: errorCodeFromHelper, // Use code from helper
      message: errorMessageFromHelper, // Use message from helper
      details: errorDetails,
    },
  };
}

interface RateLimitResult {
  limited: boolean;
  error?: boolean;
}

interface ExecuteRateLimitPipelineOptions {
  key: string;
  windowSeconds: number;
  clientIp: string;
}

// Adding the helper function and its interface before _executeRateLimitPipeline
interface ParsedPipelineResult {
  currentAttempts?: number;
  errorOccurred: boolean;
  logMessage?: string; // For logging in the caller
  logContextAdditions?: Record<string, unknown>; // For additional context for the error log
}

function _parseRateLimitPipelineResults(
  results: readonly [Error | null, unknown][] | null
): ParsedPipelineResult {
  if (!results) {
    return {
      errorOccurred: true,
      logMessage: 'Redis pipeline execution returned null/undefined results array.',
    };
  }

  const incrResult = results[0]; // expecting [error, value] from INCR

  if (!incrResult) {
    return {
      errorOccurred: true,
      logMessage: 'INCR result unexpectedly missing from pipeline results array.',
    };
  }

  if (incrResult[0]) {
    // Error from INCR command itself
    const error = incrResult[0] as Error; // Type assertion for clarity
    return {
      errorOccurred: true,
      logMessage: 'Error reported by Redis INCR command in pipeline.',
      logContextAdditions: { redisIncrError: error.message, redisFullError: error },
    };
  }

  const currentAttemptsRaw = incrResult[1];
  if (typeof currentAttemptsRaw !== 'number') {
    return {
      errorOccurred: true,
      logMessage: 'Invalid data type from Redis INCR result (expected number).',
      logContextAdditions: {
        incrValueType: typeof currentAttemptsRaw,
        incrValue: currentAttemptsRaw,
      },
    };
  }

  // Success case
  return {
    currentAttempts: currentAttemptsRaw,
    errorOccurred: false,
  };
}

async function _executeRateLimitPipeline(
  redisClient: Redis,
  options: ExecuteRateLimitPipelineOptions,
  log: Logger
): Promise<{ currentAttempts?: number; errorOccurred: boolean }> {
  const { key, windowSeconds, clientIp } = options;

  try {
    const pipeline = redisClient.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec();

    const parsed = _parseRateLimitPipelineResults(results);

    if (parsed.errorOccurred) {
      log.error(
        { redisKey: key, clientIp, ...parsed.logContextAdditions },
        parsed.logMessage || 'Error parsing rate limit pipeline results.'
      );
      return { errorOccurred: true };
    }

    return { currentAttempts: parsed.currentAttempts, errorOccurred: false };
  } catch (error) {
    log.error(
      { redisKey: key, clientIp, error },
      'Generic error during Redis pipeline.exec() call.'
    );
    return { errorOccurred: true };
  }
}

async function _checkRegistrationRateLimit(
  redisClient: Redis | null,
  clientIp: string,
  log: Logger
): Promise<RateLimitResult> {
  const logContext = { clientIp };

  if (!redisClient) {
    log.warn(
      { ...logContext },
      'Redis client is not available for registration. Skipping rate limiting. Failing open.'
    );
    return { limited: false };
  }

  const maxAttempts = env.RATE_LIMIT_REGISTER_MAX_ATTEMPTS;
  const windowSeconds = env.RATE_LIMIT_REGISTER_WINDOW_SECONDS;
  const key = `rate-limit:register:${clientIp}`;

  const { currentAttempts, errorOccurred } = await _executeRateLimitPipeline(
    redisClient,
    { key, windowSeconds, clientIp },
    log
  );

  if (errorOccurred) {
    log.error({ ...logContext, key }, 'Rate limit check failed due to Redis error. Failing open.');
    // currentAttempts might be undefined here, but error:true signifies the problem.
    return { limited: false, error: true };
  }

  // If errorOccurred is false, _parseRateLimitPipelineResults guarantees currentAttempts is a number.
  // Thus, the explicit typeof currentAttempts !== 'number' check can be removed.
  // We can directly cast/use currentAttempts as number here if TypeScript needs it, but it should infer.

  if ((currentAttempts as number) > maxAttempts) {
    // Type assertion for clarity in condition
    log.warn({ ...logContext, key, currentAttempts, maxAttempts }, 'Rate limit exceeded.');
    return { limited: true };
  }

  return { limited: false };
}

async function _checkExistingPrismaUser(
  log: Logger,
  logContext: LogContext,
  emailToCheck: string,
  db: RegisterUserDbClient
): Promise<RegistrationResult | null> {
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
    return null;
  } catch (dbCheckError) {
    log.error(
      { ...logContext, error: dbCheckError },
      'Error checking for existing user in database.'
    );
    return _handleMainRegistrationError(dbCheckError, 'checking existing user');
  }
}

async function _validateAndPrepareInputData(
  formData: FormData,
  initialLogContext: LogContext | undefined,
  log: Logger
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

// Helper to get validated data, handling FormData or pre-validated input
async function _getValidatedDataForPreChecks(
  input: FormData | RegistrationInput,
  initialLogContext: LogContext,
  log: Logger
): Promise<{ validatedData?: RegistrationInput; errorResult?: RegistrationResult }> {
  if (input instanceof FormData) {
    const validationOutcome = await _validateAndPrepareInputData(input, initialLogContext, log);
    if (validationOutcome.errorResult) {
      return { errorResult: validationOutcome.errorResult };
    }
    if (!validationOutcome.validatedData) {
      log.error(
        initialLogContext,
        '_getValidatedDataForPreChecks: _validateAndPrepareInputData returned no error but no validatedData. Internal logic error.'
      );
      return {
        errorResult: await _handleMainRegistrationError(
          new Error('Internal error during input validation processing.'),
          'internal_validation_processing_error'
        ),
      };
    }
    return { validatedData: validationOutcome.validatedData };
  } else {
    // Input is already RegistrationInput
    log.debug(
      { ...initialLogContext, email: input.email }, // Ensure email is logged if available
      '_getValidatedDataForPreChecks: Received pre-validated RegistrationInput.'
    );
    return { validatedData: input };
  }
}

async function _runRegistrationPreChecks(
  formDataOrValidatedData: FormData | RegistrationInput,
  options: PreCheckOptions
): Promise<{ validatedData?: RegistrationInput; errorResult?: RegistrationResult }> {
  const { log, db, initialLogContext = {} } = options;

  const validationPrepResult = await _getValidatedDataForPreChecks(
    formDataOrValidatedData,
    initialLogContext,
    log
  );

  if (validationPrepResult.errorResult) {
    return { errorResult: validationPrepResult.errorResult };
  }

  // Assuming _getValidatedDataForPreChecks ensures validatedData exists if no errorResult is returned.
  // Thus, the explicit check for !validationPrepResult.validatedData is removed.
  const validatedData = validationPrepResult.validatedData as RegistrationInput; // Type assertion for confidence
  const currentLogContext: LogContext = { ...initialLogContext, email: validatedData.email };

  if (env.ENABLE_REDIS_RATE_LIMITING) {
    const clientIp = await getClientIp();
    const rateLimitError = await _handleRegistrationRateLimit(log, currentLogContext, clientIp);
    if (rateLimitError) {
      return { errorResult: rateLimitError };
    }
  }

  const existingUserError = await _checkExistingPrismaUser(
    log,
    currentLogContext,
    validatedData.email,
    db
  );
  if (existingUserError) {
    return { errorResult: existingUserError };
  }

  // log.debug(currentLogContext, '_runRegistrationPreChecks: All pre-checks passed.'); // Removed
  return { validatedData };
}

// Initial setup for registration process
function _setupRegistrationContext(log: Logger): { initialLogContext: LogContext } {
  const initialLogContext: LogContext = {
    source: 'registerUserAction',
  };
  log.info(initialLogContext, 'Registration attempt started.');

  return { initialLogContext };
}

interface RegistrationCoreServices {
  db: RegisterUserDbClient;
  hasher: Hasher;
  fbService: FirebaseAdminService;
  log: Logger;
}

/**
 * Standardized error logging for authentication actions
 */
function _logAuthActionError(options: {
  logger: Logger;
  context: Record<string, unknown>;
  error: unknown;
  message: string;
  level?: 'warn' | 'error';
}): void {
  const { logger, context, error, message, level = 'error' } = options;
  const logData = { ...context, error };

  if (level === 'warn') {
    logger.warn(logData, message);
  } else {
    logger.error(logData, message);
  }
}

async function _executeRegistrationCore(
  validatedData: RegistrationInput,
  services: RegistrationCoreServices,
  logContextWithEmail: LogContext
): Promise<RegistrationResult> {
  const { db, hasher, fbService, log } = services;

  try {
    const registrationAttemptResult = await _performRegistrationAttempt(
      validatedData,
      { db, hasher, fbService, log },
      logContextWithEmail
    );

    // Handle the registration attempt result
    return _processRegistrationAttemptResult(registrationAttemptResult, validatedData, {
      log,
      logContextWithEmail,
      _db: db,
    });
  } catch (e: unknown) {
    _logAuthActionError({
      logger: log,
      context: { ...logContextWithEmail },
      error: e,
      message: 'Critical unexpected error in _executeRegistrationCore',
    });
    return _handleMainRegistrationError(e, 'critical_execute_registration_core_error', log);
  }
}

/**
 * Process the result of a registration attempt and take appropriate action
 */
function _processRegistrationAttemptResult(
  registrationAttemptResult: RegistrationResult | null | User,
  validatedData: RegistrationInput,
  options: {
    log: Logger;
    logContextWithEmail: LogContext;
    _db: RegisterUserDbClient;
  }
): Promise<RegistrationResult> {
  const { log, logContextWithEmail, _db } = options;
  if (isValidUserResult(registrationAttemptResult)) {
    const createdUser = registrationAttemptResult;
    return _handleSuccessfulRegistration(
      validatedData,
      createdUser.id,
      logContextWithEmail,
      log
    ) as Promise<RegistrationResult>;
  } else if (registrationAttemptResult === null) {
    _logAuthActionError({
      logger: log,
      context: logContextWithEmail,
      error: new Error('Unexpected null result'),
      message:
        '_executeRegistrationCore: _performRegistrationAttempt returned unexpected null. This should be a User object or RegistrationResult. Cannot proceed with post-registration sign-in reliably.',
    });
    return Promise.resolve({
      status: 'error',
      message: 'Internal error during registration: User data not available for sign-in.',
      error: { code: 'InternalError', message: 'User data missing post-creation' },
    });
  } else {
    _logAuthActionError({
      logger: log,
      context: logContextWithEmail,
      error: registrationAttemptResult,
      message: 'Registration attempt failed within core execution. Returning error response.',
      level: 'warn',
    });
    return Promise.resolve(registrationAttemptResult as RegistrationResult);
  }
}

async function registerUserLogic(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData | RegistrationInput,
  deps?: RegisterUserOptionalDeps
): Promise<ServiceResponse<null, unknown>> {
  const resolvedDeps = await _resolveRegisterDependencies(deps);
  const { log, fbService, db, hasher } = resolvedDeps;

  const { initialLogContext } = _setupRegistrationContext(log);

  const preCheckResult = await _runRegistrationPreChecks(formData, {
    log,
    db,
    initialLogContext,
  });

  if (preCheckResult.errorResult) {
    return preCheckResult.errorResult;
  }

  const validatedData = preCheckResult.validatedData as RegistrationInput;
  const logContextWithEmail: LogContext = { ...initialLogContext, email: validatedData.email };

  if (!fbService) {
    log.error(
      logContextWithEmail,
      'registerUserLogic: FirebaseAdminService is unexpectedly null before calling _executeRegistrationCore.'
    );
    return _handleMainRegistrationError(
      new Error('Internal server error: Firebase service unavailable during registration.'),
      'firebase_service_unavailable',
      log
    );
  }

  return _executeRegistrationCore(
    validatedData,
    { db, hasher, fbService, log },
    logContextWithEmail
  );
}

export async function registerUserAction(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData
): Promise<ServiceResponse<null, unknown>> {
  return registerUserLogic(null, formData);
}

interface ResolvedRegisterDeps {
  log: Logger;
  fbService: FirebaseAdminService | undefined | null;
  db: RegisterUserDbClient;
  hasher: Hasher;
}

async function _resolveRegisterDependencies(
  deps?: RegisterUserOptionalDeps
): Promise<ResolvedRegisterDeps> {
  const log = deps?.logger || actionLogger.child({ function: '_resolveRegisterDependencies' });
  let resolvedFbService: FirebaseAdminService | null | undefined = deps?.fbService;

  if (!resolvedFbService) {
    log.info(
      'FirebaseAdminService not provided in deps, attempting to get from getFirebaseAdminService.'
    );
    resolvedFbService = await getFirebaseAdminService(); // Await the promise
    if (resolvedFbService) {
      log.info('Successfully retrieved FirebaseAdminService via getFirebaseAdminService.');
    } else {
      log.warn(
        'Failed to retrieve FirebaseAdminService via getFirebaseAdminService. Registration will likely fail if action proceeds.'
      );
    }
  } else {
    log.info('FirebaseAdminService was provided directly in dependencies.');
  }

  const db = deps?.db || {
    user: {
      findUnique: prisma.user.findUnique,
      create: prisma.user.create,
    },
  };
  const hasherInstance = deps?.hasher || { hash };

  return {
    log,
    fbService: resolvedFbService,
    db,
    hasher: hasherInstance,
  };
}

async function _handleRegistrationRateLimit(
  log: Logger,
  logContext: LogContext, // Made LogContext more general
  clientIp: string | null | undefined
): Promise<RegistrationResult | null> {
  if (!clientIp) {
    log.warn(
      { ...logContext }, // Spread logContext
      'Could not determine client IP for rate limiting. Failing open.'
    );
    return null;
  }
  const ipToCheck = clientIp;
  const redisClient = await getOptionalRedisClient();
  const rateLimitResult = await _checkRegistrationRateLimit(redisClient, ipToCheck, log);

  if (rateLimitResult.error) {
    log.warn(
      { ...logContext, clientIp: ipToCheck },
      'Rate limit check failed, but proceeding (fail open).'
    );
    return null;
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
  return null;
}

async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: LogContext
): Promise<RegistrationResult | null | User> {
  const { log, fbService, db, hasher } = services;
  const { email, password, name } = validatedData;
  let firebaseUser: admin.auth.UserRecord | undefined;

  try {
    firebaseUser = await _createFirebaseUser({ email, password, name }, fbService, logContext);

    const prismaUserResult = await _createPrismaUser(
      firebaseUser,
      password,
      { db, hasher, fbService, log },
      { logContext: { ...logContext, uid: firebaseUser.uid } }
    );

    if (!(prismaUserResult instanceof Error) && 'id' in prismaUserResult && prismaUserResult.id) {
      return prismaUserResult as User;
    } else {
      return prismaUserResult as RegistrationResult;
    }
  } catch (error) {
    log.error(
      { ...logContext, error, firebaseUidAttempted: firebaseUser?.uid },
      '_performRegistrationAttempt: Error during Firebase user creation or other unexpected issue.'
    );
    await _attemptManualFirebaseRollbackOnError(firebaseUser, error, fbService, logContext);
    return _handleMainRegistrationError(error, 'firebase_user_creation_or_unexpected_error', log);
  }
}

async function _attemptManualFirebaseRollbackOnError(
  firebaseUser: admin.auth.UserRecord | undefined,
  triggeringError: unknown,
  fbService: FirebaseAdminService,
  baseLogContext: LogContext
): Promise<void> {
  if (firebaseUser && !(triggeringError instanceof RollbackError)) {
    const logContext = { ...baseLogContext, uid: firebaseUser.uid, triggeringError };
    actionLogger.warn(
      logContext,
      '_attemptManualFirebaseRollbackOnError: Unexpected error after Firebase user creation. Attempting manual rollback.'
    );

    await _performFirebaseUserDeletion(firebaseUser.uid, fbService, logContext);
  }
}

/**
 * Helper function to attempt Firebase user deletion during rollback
 */
async function _performFirebaseUserDeletion(
  userId: string,
  fbService: FirebaseAdminService,
  logContext: LogContext
): Promise<void> {
  try {
    await fbService.deleteUser(userId);
    actionLogger.info(
      { ...logContext, uid: userId },
      '_performFirebaseUserDeletion: Manual Firebase user rollback successful.'
    );
  } catch (rollbackError) {
    actionLogger.error(
      { ...logContext, uid: userId, rollbackError },
      '_performFirebaseUserDeletion: Manual Firebase user rollback FAILED.'
    );
  }
}

/**
 * Logs the result of the post-registration sign-in attempt.
 */

interface SignInResultObject {
  ok?: boolean;
  error?: string | null;
  status?: number;
  url?: string | null;
  // It can also be other things not strictly defined here, hence the `any` usage in some places
  // if we can't be sure of the structure from NextAuth's various return possibilities.
}

interface FailedSignInResultDetails {
  originalInput: unknown;
  typedResult: SignInResultObject | string | null;
}

function _logSignInResult(
  signInResultInput: unknown, // Can be string, object with ok/error, or other
  userId: string,
  logContextWithEmail: LogContext,
  log: Logger
): { signInConsideredSuccessful: boolean } {
  let typedSignInResult: SignInResultObject | string | null = null;
  if (typeof signInResultInput === 'string') {
    typedSignInResult = signInResultInput;
  } else if (isObject(signInResultInput)) {
    typedSignInResult = signInResultInput as SignInResultObject; // Cast to our interface
  }

  const isErrorObject =
    isObject(typedSignInResult) && 'error' in typedSignInResult && typedSignInResult.error !== null;
  const explicitOk = isObject(typedSignInResult) && typedSignInResult.ok === true;
  const isLikelySuccessUrl = typeof typedSignInResult === 'string';

  const signInConsideredSuccessful = !isErrorObject && (explicitOk || isLikelySuccessUrl);

  if (signInConsideredSuccessful) {
    _logSuccessfulSignInDetails(typedSignInResult, userId, logContextWithEmail, log);
  } else {
    _logFailedSignInDetails(
      { originalInput: signInResultInput, typedResult: typedSignInResult },
      userId,
      logContextWithEmail,
      log
    );
  }
  return { signInConsideredSuccessful };
}

function _logSuccessfulSignInDetails(
  signInResult: SignInResultObject | string | null, // It's typedSignInResult from caller
  userId: string,
  logContextWithEmail: LogContext,
  log: Logger
) {
  log.info(
    {
      ...logContextWithEmail,
      userId,
      signInStatus: isObject(signInResult) ? signInResult.status : undefined,
      signInUrl:
        typeof signInResult === 'string'
          ? signInResult
          : isObject(signInResult)
            ? signInResult.url
            : undefined,
    },
    'Post-registration sign-in process completed. Assumed successful based on signIn result type (URL or ok:true).'
  );
}

function _logFailedSignInDetails(
  results: FailedSignInResultDetails,
  userId: string,
  logContextWithEmail: LogContext,
  log: Logger
) {
  _logAuthActionError({
    logger: log,
    context: {
      ...logContextWithEmail,
      userId,
      signInError:
        isObject(results.typedResult) && results.typedResult.error
          ? results.typedResult.error
          : 'Result was not an error object or string, or ok was not true.',
      signInStatus: isObject(results.typedResult) ? results.typedResult.status : undefined,
      signInOk: isObject(results.typedResult) ? results.typedResult.ok : undefined,
      signInUrl: isObject(results.typedResult) ? results.typedResult.url : undefined,
      fullSignInResult: results.originalInput, // Log the original input for full context
    },
    error: results.typedResult,
    message:
      'Post-registration sign-in failed or response was not indicative of success. See fullSignInResult for details.',
    level: 'warn',
  });
}

/**
 * Handle the post-registration success path including sign-in attempt
 */
async function _handleSuccessfulRegistration(
  validatedData: RegistrationInput,
  userIdToSignIn: string,
  logContextWithEmail: LogContext,
  log: Logger
): Promise<ServiceResponse<null, unknown>> {
  const userId = userIdToSignIn;

  if (userId === 'unknown') {
    log.error(
      { ...logContextWithEmail },
      "_handleSuccessfulRegistration: Received 'unknown' userId. Cannot proceed with post-registration sign-in."
    );
    // Still return success for registration, but log this critical internal error.
    return {
      status: 'success',
      message:
        'Registration successful, but internal error prevented sign-in attempt (unknown user ID).',
      data: null,
    };
  }

  log.info(
    { ...logContextWithEmail, userId },
    'Registration successful. Attempting post-registration sign-in.'
  );

  try {
    // The signIn call itself is not extracted as it's a core part of this function's purpose.
    // The complexity came from handling its result.
    const signInResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
      isPostRegistration: true,
      postRegistrationUserId: userId,
      postRegistrationUserEmail: validatedData.email,
      postRegistrationUserName: validatedData.name || null,
    });

    _logSignInResult(signInResult, userId, logContextWithEmail, log);
  } catch (signInError) {
    log.error(
      { ...logContextWithEmail, error: signInError, userId },
      'Error during post-registration sign-in attempt.'
    );
    // Even if sign-in fails, registration was successful.
    // The error is logged, but we don't want to tell the user registration failed.
  }

  return {
    status: 'success',
    message: 'Registration successful', // User is registered, sign-in is best-effort here.
    data: null,
  };
}
