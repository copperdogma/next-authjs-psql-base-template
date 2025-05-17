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
import type { Logger as PinoLogger } from 'pino';

import { logger as rootLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { firebaseAdminService } from '@/lib/server/services';
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
  log: PinoLogger;
}

interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  fbService?: FirebaseAdminService;
  logger?: PinoLogger;
}

interface PreCheckOptions {
  log: PinoLogger;
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
    actionLogger.error({ ...logContext, error }, '_createFirebaseUser: FAILED');
    throw error;
  }
}

async function _createPrismaUser(
  firebaseUser: admin.auth.UserRecord,
  passwordToHash: string,
  services: { db: RegisterUserDbClient; hasher: Hasher; fbService: FirebaseAdminService },
  options: CreatePrismaUserOptions
): Promise<User | RegistrationResult> {
  const { db, hasher, fbService } = services;
  const { logContext, tx } = options;
  const prismaOps = tx || db;
  actionLogger.debug(logContext, '_createPrismaUser: Starting Prisma user creation process...');

  const email = firebaseUser.email;
  if (!email) {
    actionLogger.error(
      { ...logContext, uid: firebaseUser.uid },
      '_createPrismaUser: Firebase user record unexpectedly missing email.'
    );
    throw new Error('Firebase user record missing email during Prisma user creation.');
  }
  const logContextBase = { ...logContext, email, uid: firebaseUser.uid };

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
  _log?: PinoLogger
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

async function _executeRateLimitPipeline(
  redisClient: Redis,
  options: ExecuteRateLimitPipelineOptions,
  log: PinoLogger
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

    if (!results) {
      log.error(logContext, 'Redis pipeline execution returned null/undefined.');
      return { errorOccurred: true };
    }

    const incrResult = results[0];

    if (incrResult && incrResult[0]) {
      log.error(
        { ...logContext, redisError: incrResult[0] },
        'Error during Redis INCR in pipeline.'
      );
      return { errorOccurred: true };
    }

    const currentAttemptsRaw = incrResult ? incrResult[1] : undefined;

    if (typeof currentAttemptsRaw !== 'number') {
      log.error(
        { ...logContext, incrResultRaw: currentAttemptsRaw },
        'Invalid result type from Redis INCR.'
      );
      return { errorOccurred: true };
    }

    log.debug(
      { ...logContext, currentAttempts: currentAttemptsRaw },
      'Rate limit check successful.'
    );
    return { currentAttempts: currentAttemptsRaw, errorOccurred: false };
  } catch (error) {
    log.error({ ...logContext, error }, 'Generic error during Redis pipeline execution.');
    return { errorOccurred: true };
  }
}

async function _checkRegistrationRateLimit(
  redisClient: Redis | null,
  clientIp: string,
  log: PinoLogger
): Promise<RateLimitResult> {
  const logContext = { clientIp };
  log.debug(logContext, 'Checking registration rate limit...');

  if (!redisClient) {
    log.warn(
      'Redis client is not available for registration. Skipping rate limiting. Failing open.'
    );
    return { limited: false };
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
    return { limited: false, error: true };
  }

  if (typeof currentAttempts !== 'number') {
    log.error(
      { ...logContext, key, currentAttempts },
      'Rate limit check failed: currentAttempts is undefined despite no reported error. Failing open.'
    );
    return { limited: false, error: true };
  }

  if (currentAttempts > maxAttempts) {
    log.warn({ ...logContext, key, currentAttempts, maxAttempts }, 'Rate limit exceeded.');
    return { limited: true };
  }

  log.debug({ ...logContext, key, currentAttempts, maxAttempts }, 'Rate limit check passed.');
  return { limited: false };
}

async function _createPrismaUserAndAttemptSignIn(
  firebaseUser: admin.auth.UserRecord,
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: LogContext
): Promise<RegistrationResult | null> {
  actionLogger.debug(
    logContext,
    '_createPrismaUserAndAttemptSignIn: Beginning process to create Prisma user and then attempt sign-in.'
  );
  const { log } = services;

  let createdPrismaUser: User | null = null;

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
        { ...services, db: tx as unknown as RegisterUserDbClient },
        { logContext: { email: validatedData.email, uid: firebaseUser.uid }, tx }
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
      return user as User;
    });

    createdPrismaUser = prismaUserResult;
    actionLogger.info(
      { ...logContext, userId: createdPrismaUser.id },
      '_createPrismaUserAndAttemptSignIn: Prisma user creation transaction Succeeded.'
    );
  } catch (error: unknown) {
    actionLogger.error(
      { ...logContext, error },
      '_createPrismaUserAndAttemptSignIn: Prisma user creation transaction failed or was rolled back.'
    );
    if (error instanceof RollbackError) {
      return _handleMainRegistrationError(
        error,
        'prisma creation transaction rollback with RollbackError'
      );
    }
    return _handleMainRegistrationError(error, 'prisma creation transaction');
  }

  if (!createdPrismaUser) {
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

  actionLogger.debug(
    { ...logContext, userId: createdPrismaUser.id },
    '_createPrismaUserAndAttemptSignIn: Attempting post-registration sign-in...'
  );

  const signInResult = await _attemptPostRegistrationSignIn(
    createdPrismaUser.email as string,
    validatedData.password,
    log,
    {
      userId: createdPrismaUser.id,
      email: createdPrismaUser.email as string,
      name: createdPrismaUser.name,
    }
  );

  if (signInResult && signInResult.status === 'error') {
    actionLogger.warn(
      { ...logContext, userId: createdPrismaUser.id, error: signInResult.error },
      '_createPrismaUserAndAttemptSignIn: Post-registration sign-in failed. Prisma user ALREADY COMMITTED.'
    );
    return signInResult;
  }

  actionLogger.info(
    { ...logContext, userId: createdPrismaUser.id },
    '_createPrismaUserAndAttemptSignIn: Post-registration sign-in successful.'
  );
  return null;
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
    try {
      await fbService.deleteUser(firebaseUser.uid);
      actionLogger.info(
        { ...logContext, uid: firebaseUser.uid },
        '_attemptManualFirebaseRollbackOnError: Manual Firebase user rollback successful.'
      );
    } catch (rollbackError) {
      actionLogger.error(
        { ...logContext, uid: firebaseUser.uid, rollbackError },
        '_attemptManualFirebaseRollbackOnError: Manual Firebase user rollback FAILED.'
      );
    }
  }
}

async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: LogContext
): Promise<RegistrationResult | null> {
  const { log, fbService, db, hasher } = services;
  const { email, password, name } = validatedData;
  let firebaseUser: admin.auth.UserRecord | undefined;

  log.info(logContext, '_performRegistrationAttempt: Starting registration process.');

  try {
    firebaseUser = await _createFirebaseUser({ email, password, name }, fbService, logContext);
    const step1LogContext = { ...logContext, uid: firebaseUser.uid };
    log.debug(step1LogContext, '_performRegistrationAttempt: Firebase user created.');

    const prismaUserResult = await _createPrismaUser(
      firebaseUser,
      password,
      { db, hasher, fbService },
      { logContext: step1LogContext }
    );

    if (!(prismaUserResult instanceof Error) && 'id' in prismaUserResult && prismaUserResult.id) {
      log.info(
        { ...step1LogContext, userId: prismaUserResult.id },
        '_performRegistrationAttempt: Prisma user created successfully.'
      );
      return null;
    } else {
      log.warn(
        step1LogContext,
        '_performRegistrationAttempt: _createPrismaUser indicated an error. Propagating error response.'
      );
      return prismaUserResult as RegistrationResult;
    }
  } catch (error) {
    log.error(
      { ...logContext, error, firebaseUidAttempted: firebaseUser?.uid },
      '_performRegistrationAttempt: Main try-catch block error.'
    );
    await _attemptManualFirebaseRollbackOnError(firebaseUser, error, fbService, logContext);
    return _handleMainRegistrationError(
      error,
      'firebase user creation or unknown initial error',
      log
    );
  }
}

interface ResolvedRegisterDeps {
  log: PinoLogger;
  fbService: FirebaseAdminService | undefined;
  db: RegisterUserDbClient;
  hasher: Hasher;
}

function _resolveRegisterDependencies(deps?: RegisterUserOptionalDeps): ResolvedRegisterDeps {
  const defaultLog = actionLogger.child({ function: '_resolveRegisterDependencies' });
  const resolvedLogger = deps?.logger || defaultLog;
  const fbServiceInstance = deps?.fbService || firebaseAdminService;

  return {
    log: resolvedLogger,
    fbService: fbServiceInstance,
    db: deps?.db || prisma,
    hasher: deps?.hasher || { hash },
  };
}

async function _handleRegistrationRateLimit(
  log: PinoLogger,
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

async function _checkExistingPrismaUser(
  log: PinoLogger,
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

async function _runRegistrationPreChecks(
  formDataOrValidatedData: FormData | RegistrationInput,
  options: PreCheckOptions
): Promise<{ validatedData?: RegistrationInput; errorResult?: RegistrationResult }> {
  const { log, db, initialLogContext = {} } = options; // Default initialLogContext
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

  const currentLogContext: LogContext = { ...initialLogContext, email: validatedData.email };

  if (env.ENABLE_REDIS_RATE_LIMITING) {
    const clientIp = await getClientIp(); // Await client IP for rate limiting
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

  log.debug(currentLogContext, '_runRegistrationPreChecks: All pre-checks passed.');
  return { validatedData };
}

async function registerUserLogic(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData | RegistrationInput,
  deps?: RegisterUserOptionalDeps
): Promise<ServiceResponse<null, unknown>> {
  const resolvedDeps = _resolveRegisterDependencies(deps);
  const { log, fbService, db, hasher } = resolvedDeps;

  const initialLogContext: LogContext = {
    source: 'registerUserAction',
  };
  log.info(initialLogContext, 'Registration attempt started.');

  const preCheckResult = await _runRegistrationPreChecks(formData, {
    log,
    db,
    initialLogContext,
  });

  if (preCheckResult.errorResult) {
    return preCheckResult.errorResult;
  }
  if (!preCheckResult.validatedData) {
    log.error(
      initialLogContext,
      'Pre-check completed without validated data or an error result. This is unexpected.'
    );
    return _handleMainRegistrationError(
      new Error('Internal error: Invalid pre-check state'),
      'pre-check state',
      log
    );
  }
  const validatedData = preCheckResult.validatedData;
  const logContextWithEmail: LogContext = { ...initialLogContext, email: validatedData.email };
  log.info(logContextWithEmail, 'Input validation and pre-checks successful.');

  if (!fbService) {
    log.error(logContextWithEmail, 'FirebaseAdminService not available for registration.');
    return _handleMainRegistrationError(
      new Error('Firebase service not configured'),
      'firebase service check',
      log
    );
  }

  try {
    const registrationAttemptResult = await _performRegistrationAttempt(
      validatedData,
      { db, hasher, fbService, log },
      logContextWithEmail
    );

    if (registrationAttemptResult === null) {
      log.info(
        logContextWithEmail,
        'Registration successful. Attempting post-registration sign-in.'
      );
      const signInResult = await _attemptPostRegistrationSignIn(
        validatedData.email,
        validatedData.password,
        log,
        { userId: 'unknown', email: validatedData.email, name: validatedData.name || null }
      );

      if (signInResult && signInResult.status === 'error') {
        log.warn(
          logContextWithEmail,
          'Post-registration sign-in failed, but registration itself was successful.'
        );
      }

      return {
        status: 'success',
        message: 'Registration successful',
        data: null,
      };
    } else {
      log.warn(logContextWithEmail, 'Registration attempt failed. Returning error response.');
      return registrationAttemptResult;
    }
  } catch (e: unknown) {
    log.error(
      { ...logContextWithEmail, error: e },
      'Critical unexpected error in registerUserLogic'
    );
    return _handleMainRegistrationError(e, 'critical registerUserLogic error', log);
  }
}

export async function registerUserAction(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData
): Promise<ServiceResponse<null, unknown>> {
  return registerUserLogic(null, formData);
}

interface BuildPostSignInErrorOptions {
  signInResultFromNextAuth: { ok?: boolean; error?: string | null; status?: number } | null;
  isException: boolean;
  exceptionError?: unknown;
}

// Helper to build the error response for _attemptPostRegistrationSignIn
function _buildPostSignInErrorResponse(
  log: PinoLogger,
  logContext: LogContext,
  options: BuildPostSignInErrorOptions
): RegistrationResult {
  const { signInResultFromNextAuth, isException, exceptionError } = options;

  const code = isException ? 'AUTO_SIGNIN_EXCEPTION' : 'AUTO_SIGNIN_FAILED';
  const internalMessage = isException
    ? 'Exception during automatic sign-in after registration.'
    : 'Registration successful but automatic sign-in failed.';
  const userFacingMessage = isException
    ? 'Registration successful! Please sign in with your new account.'
    : 'Registration successful but automatic sign-in failed. Please sign in manually.';

  log.warn(
    {
      ...logContext,
      signInErrorDetail: internalMessage,
      status: signInResultFromNextAuth?.status,
      errorFromSignIn: signInResultFromNextAuth?.error,
      exception: exceptionError,
    },
    internalMessage
  );

  return {
    status: 'error',
    message: userFacingMessage,
    error: {
      code,
      message: internalMessage,
      details: {
        originalError: isException
          ? exceptionError
          : signInResultFromNextAuth?.error || 'Unknown sign-in error',
      },
    },
  };
}

async function _attemptPostRegistrationSignIn(
  email: string,
  passwordAttempt: string,
  log: PinoLogger,
  postRegistrationData?: { userId: string; email: string; name: string | null }
): Promise<RegistrationResult | null> {
  const logContext: LogContext = {
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
      { ...logContext, success: !!signInResult?.ok, rawSignInResult: signInResult },
      'Post-registration sign-in attempt completed'
    );

    const isSignInSuccessful = signInResult?.ok || (signInResult && !signInResult.error);

    if (isSignInSuccessful) {
      log.info(
        { ...logContext, signInResultStatus: signInResult?.status },
        'Post-registration sign-in successful based on signInResult inspection'
      );
      return null;
    }
    return _buildPostSignInErrorResponse(log, logContext, {
      signInResultFromNextAuth: signInResult,
      isException: false,
    });
  } catch (error) {
    log.error({ ...logContext, error }, 'Error during automatic post-registration sign-in');
    return _buildPostSignInErrorResponse(log, logContext, {
      signInResultFromNextAuth: null,
      isException: true,
      exceptionError: error,
    });
  }
}
