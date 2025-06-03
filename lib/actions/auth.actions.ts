'use server'; // Restore directive

import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { Logger } from 'pino';

import { logger as rootLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth-node';
import type { ServiceResponse } from '@/types';
import { type Redis } from 'ioredis';
import { getOptionalRedisClient } from '@/lib/redis';
import { getClientIp } from '@/lib/utils/server-utils';
import { env } from '@/lib/env';
import { isValidUserResult } from '../utils/type-guards'; // Keep isValidUserResult if used

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

interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  logger?: Logger;
  initialLogContext?: LogContext;
}

interface PreCheckOptions {
  log: Logger;
  db: RegisterUserDbClient;
  initialLogContext?: LogContext;
}

// --- Private Helper Functions --- //

async function _validateRegistrationInput(
  formData: FormData
): Promise<z.SafeParseReturnType<RegistrationInput, RegistrationInput>> {
  const rawFormData = Object.fromEntries(formData.entries());
  return RegistrationSchema.safeParse(rawFormData);
}

/**
 * Creates a user in the database with the provided data.
 *
 * This function supports being called either as a standalone operation or as part of a
 * database transaction. When called with a transaction client via the `tx` parameter,
 * the operation becomes part of that transaction, enabling atomic operations when
 * creating multiple related records.
 *
 * @param data User data including email, password to hash, and optional name
 * @param services Required services for creating a user
 * @param options Additional options including logging context and optional transaction client
 * @returns Created user object if successful, or error result
 */
async function _createPrismaUser(
  data: { email: string; passwordToHash: string; name?: string | null },
  services: {
    db: RegisterUserDbClient;
    hasher: Hasher;
    log: Logger;
  },
  options: { logContext: LogContext; tx?: Prisma.TransactionClient }
): Promise<User | RegistrationResult> {
  const { db, hasher, log: _log } = services;
  const { logContext, tx } = options;
  const prismaOps = tx || db;
  const { email, passwordToHash, name } = data;

  const baseLogContext = { ...logContext, email };

  _log.debug(
    baseLogContext,
    '_createPrismaUser: Attempting DB create. Hashing password & preparing data...'
  );
  try {
    const hashedPassword = await hasher.hash(passwordToHash, SALT_ROUNDS);
    const prismaUser = await prismaOps.user.create({
      data: {
        name: name ?? null,
        email: email,
        hashedPassword,
        emailVerified: null,
      },
    });
    _log.debug(
      { ...baseLogContext, userId: prismaUser.id },
      '_createPrismaUser: DB create success'
    );
    return prismaUser;
  } catch (dbError) {
    _log.error({ ...baseLogContext, error: dbError }, '_createPrismaUser: DB create FAILED');
    const errorPayload = _determineErrorTypeAndTranslate(
      dbError,
      'prisma user creation',
      baseLogContext
    );
    return {
      status: 'error',
      error: {
        code: errorPayload.code,
        message: errorPayload.message,
        details: { originalError: errorPayload.originalErrorForDetails },
      },
    };
  }
}

// Restore ProcessedErrorInfo interface
interface ProcessedErrorInfo {
  code: string;
  message: string;
  originalErrorForDetails: unknown;
}

function _determineErrorTypeAndTranslate(
  error: unknown,
  context: string,
  initialLogContext: object
): ProcessedErrorInfo {
  actionLogger.debug(
    { error, context, initialLogContext },
    '_determineErrorTypeAndTranslate: Determining error type'
  );

  if (error instanceof z.ZodError) {
    actionLogger.warn({ context, error }, 'Zod validation error');
    return {
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      originalErrorForDetails: error.flatten().fieldErrors,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    actionLogger.warn(
      { context, errorCode: error.code, errorMeta: error.meta },
      'Prisma known request error'
    );
    const translated = _translatePrismaError(error);
    return {
      code: translated.code,
      message: translated.message,
      originalErrorForDetails: error,
    };
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    actionLogger.warn({ context, error }, 'Prisma validation error');
    return {
      code: 'DB_VALIDATION_ERROR',
      message: 'Database validation error: ' + error.message.substring(0, 100),
      originalErrorForDetails: error,
    };
  }

  // Generic error handling
  const actualError = error instanceof Error ? error : new Error(String(error));
  const translatedGenericError = helper_translateGenericError(actualError);
  actionLogger.error(
    { context, error: actualError, translatedCode: translatedGenericError.code },
    `Generic error in ${context}: ${translatedGenericError.message}`
  );
  return {
    code: translatedGenericError.code,
    message: translatedGenericError.message,
    originalErrorForDetails: actualError,
  };
}

async function _handleMainRegistrationError(
  error: unknown,
  context: string,
  _log?: Logger,
  initialLogContext?: LogContext
): Promise<RegistrationResult> {
  const log = _log || actionLogger;
  log.error({ error, context, ...initialLogContext }, `_handleMainRegistrationError: ${context}`);

  const errorPayload = _determineErrorTypeAndTranslate(error, context, initialLogContext || {});
  return {
    status: 'error',
    error: {
      code: errorPayload.code,
      message: errorPayload.message,
      details: { originalError: errorPayload.originalErrorForDetails },
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
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists.',
        },
      };
    }
    return null;
  } catch (dbError) {
    log.error({ ...logContext, error: dbError }, 'Error checking for existing user in database.');
    const errorPayload = _translatePrismaError(dbError as Prisma.PrismaClientKnownRequestError);
    return {
      status: 'error',
      error: {
        code: errorPayload.code,
        message: errorPayload.message,
        details: { originalError: dbError },
      },
    };
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
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed.',
          details: { validationErrors },
        },
        errors: validationErrors,
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

/**
 * Execute the core registration logic, creating a user in the database.
 *
 * Note: The current implementation involves a single primary database write operation.
 * If this registration logic is extended to create multiple related database records
 * (e.g., an associated default profile entity, an initial workspace, user preferences record, etc.),
 * all such dependent writes should be wrapped within a Prisma transaction to ensure atomicity
 * and data consistency.
 *
 * Example with transaction:
 * ```typescript
 * const result = await prisma.$transaction(async (tx) => {
 *   // Create user
 *   const user = await tx.user.create({ data: {...} });
 *
 *   // Create related records using the same transaction
 *   await tx.profile.create({ data: { userId: user.id, ... } });
 *   await tx.workspace.create({ data: { ownerId: user.id, ... } });
 *
 *   return user;
 * });
 * ```
 *
 * For more information, refer to Prisma documentation on transactions:
 * https://www.prisma.io/docs/concepts/components/prisma-client/transactions
 *
 * @param validatedData Validated user registration data
 * @param services Services required for registration
 * @param logContextWithEmail Logging context with user email
 * @returns User object if successful, or error result
 */
async function _executeRegistrationCore(
  validatedData: RegistrationInput,
  services: RegistrationCoreServices,
  logContextWithEmail: LogContext
): Promise<RegistrationResult | User> {
  // Return type can now also be User
  const { db, hasher, log } = services;
  const { email, password, name } = validatedData;

  log.debug(logContextWithEmail, '_executeRegistrationCore: Starting core registration logic.');

  // 1. Create user directly in Prisma
  const createPrismaUserResult = await _createPrismaUser(
    { email, passwordToHash: password, name },
    { db, hasher, log },
    { logContext: logContextWithEmail }
  );

  if (!isValidUserResult(createPrismaUserResult)) {
    // Check if it's a ServiceResponse (error)
    log.warn(
      { ...logContextWithEmail, errorResult: createPrismaUserResult.error },
      '_executeRegistrationCore: Prisma user creation failed.'
    );
    return createPrismaUserResult; // This is a RegistrationResult (error)
  }

  // If successful, createPrismaUserResult is a User object
  const prismaUser = createPrismaUserResult;
  log.info(
    { ...logContextWithEmail, userId: prismaUser.id },
    '_executeRegistrationCore: Prisma user successfully created.'
  );
  return prismaUser; // Return the created User object
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
  }
): Promise<RegistrationResult> {
  const { log, logContextWithEmail } = options;
  logContextWithEmail.action = logContextWithEmail.action ?? 'handleOAuthSignIn';
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
      message:
        'Registration attempt failed within core execution. Returning existing error response.',
      level: 'warn',
    });
    // Directly return the pre-existing error object that conforms to RegistrationResult
    return Promise.resolve(registrationAttemptResult); // Ensure it's a promise
  }
}

async function registerUserLogic(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData | RegistrationInput,
  deps?: RegisterUserOptionalDeps
): Promise<ServiceResponse<null, unknown>> {
  const { log, db, hasher } = await _resolveRegisterDependencies(deps);
  const { initialLogContext } = _setupRegistrationContext(log);

  const preCheckResult = await _runRegistrationPreChecks(formData, {
    log,
    db,
    initialLogContext,
  });

  if (preCheckResult.errorResult) return preCheckResult.errorResult;
  if (!preCheckResult.validatedData) {
    log.error(
      initialLogContext,
      'registerUserLogic: Pre-checks passed but no validated data. This should not happen.'
    );
    const genericError = new Error('Internal server error during pre-checks.');
    const errorPayload = helper_translateGenericError(genericError);
    return {
      status: 'error',
      message: errorPayload.message,
      error: {
        code: errorPayload.code,
        message: errorPayload.message,
        details: { originalError: genericError },
      },
    };
  }

  const validatedData = preCheckResult.validatedData;
  const logContextWithEmail = { ...initialLogContext, email: validatedData.email };

  // Core registration logic
  const registrationAttemptResult = await _executeRegistrationCore(
    validatedData,
    { db, hasher, log },
    logContextWithEmail
  );

  return _processRegistrationAttemptResult(registrationAttemptResult, validatedData, {
    log,
    logContextWithEmail,
  });
}

export async function registerUserAction(
  _prevState: ServiceResponse<null, unknown> | null,
  formData: FormData
): Promise<ServiceResponse<null, unknown>> {
  return registerUserLogic(null, formData);
}

interface ResolvedRegisterDeps {
  log: Logger;
  db: RegisterUserDbClient;
  hasher: Hasher;
}

async function _resolveRegisterDependencies(
  deps?: RegisterUserOptionalDeps
): Promise<ResolvedRegisterDeps> {
  const log = deps?.logger || actionLogger;
  const db = deps?.db || prisma;
  const hasherInstance = deps?.hasher || { hash };

  return {
    log,
    db: {
      user: {
        findUnique: db.user.findUnique.bind(db.user),
        create: db.user.create.bind(db.user),
      },
    },
    hasher: hasherInstance,
  };
}

/**
 * Handles registration rate limiting based on client IP.
 *
 * IMPORTANT: This implementation uses a "fail-open" approach. If Redis is unavailable,
 * misconfigured, or encounters errors, rate limiting will be SKIPPED and registration
 * will be allowed to proceed. This design prioritizes service availability over
 * strict rate limit enforcement.
 *
 * For production environments where strict rate limiting is critical, ensure:
 * 1. Redis is properly configured and highly available
 * 2. ENABLE_REDIS_RATE_LIMITING is set to "true"
 * 3. REDIS_URL points to a valid Redis instance
 *
 * @param log Logger instance
 * @param logContext Context for logging
 * @param clientIp Client IP address for rate limiting
 * @returns Rate limit error result or null to proceed with registration
 */
async function _handleRegistrationRateLimit(
  log: Logger,
  logContext: LogContext,
  clientIp: string | null | undefined
): Promise<RegistrationResult | null> {
  if (!env.ENABLE_REDIS_RATE_LIMITING) {
    log.info(logContext, 'Redis rate limiting is disabled. Skipping check.');
    return null;
  }
  if (!clientIp) {
    log.warn(logContext, 'Client IP not available, skipping rate limit check.');
    return null; // Or return an error if IP is mandatory for rate limiting
  }

  const redisClient = await getOptionalRedisClient();
  if (!redisClient) {
    // FAIL-OPEN BEHAVIOR: If Redis is unavailable or misconfigured, we skip rate limiting entirely.
    // This means registration attempts will not be limited if Redis is down or not properly configured.
    // For production environments where rate limiting is critical for security, ensure Redis is properly
    // configured and highly available. Consider implementing a fallback mechanism if needed.
    log.warn(logContext, 'Redis client not available, skipping rate limit check.');
    return null;
  }

  const { limited, error: redisError } = await _checkRegistrationRateLimit(
    redisClient,
    clientIp,
    log.child(logContext)
  );

  if (redisError) {
    // FAIL-OPEN BEHAVIOR: If Redis encounters an error during the rate limit check,
    // we proceed as if the user is not rate limited. This prioritizes service availability
    // over strict rate limit enforcement.
    log.error(
      { ...logContext, error: redisError },
      'Error during rate limit check, proceeding as if not limited.'
    );
    return null; // Fail open on Redis error during rate limiting
  }

  if (limited) {
    log.warn(logContext, 'Rate limit exceeded for registration.');
    return {
      status: 'error',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts. Please try again later.',
      },
    };
  }
  return null;
}

async function _handleSuccessfulRegistration(
  validatedData: RegistrationInput,
  userIdToSignIn: string,
  logContextWithEmail: LogContext,
  log: Logger
): Promise<ServiceResponse<null, unknown>> {
  log.info(
    { ...logContextWithEmail, userId: userIdToSignIn },
    '_handleSuccessfulRegistration: User registration successful. Attempting to sign in.'
  );

  try {
    // Important: Use the same credentials that were just validated and used for creation.
    const signInResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password, // Send the plain password for CredentialsProvider
      redirect: false, // Prevent NextAuth.js from redirecting; we handle response.
    });

    // signIn for credentials provider usually returns null on success or an error object on failure when redirect is false.
    // It can also return a URL string if redirect is not false and successful, but we set redirect: false.
    // It might return an object like { error: string | null, status: number, ok: boolean, url: string | null }

    // Simplified check: if there's an error property, it failed.
    if (
      signInResult &&
      typeof signInResult === 'object' &&
      'error' in signInResult &&
      signInResult.error
    ) {
      log.warn(
        { ...logContextWithEmail, userId: userIdToSignIn, signInError: signInResult.error },
        'Post-registration sign-in failed.'
      );
      // Even if sign-in fails, registration was successful.
      // We return a success for registration but include a message about sign-in failure.
      return {
        status: 'success',
        message:
          'Registration successful, but automatic sign-in failed. Please try logging in manually.',
        data: null,
      };
    }

    log.info(
      { ...logContextWithEmail, userId: userIdToSignIn, signInResult },
      'Post-registration sign-in successful.'
    );
    return { status: 'success', data: null, message: 'Registration and sign-in successful' };
  } catch (error) {
    log.error(
      { ...logContextWithEmail, userId: userIdToSignIn, error },
      'Post-registration sign-in attempt threw an unexpected error.'
    );
    // Registration was successful, but sign-in critically failed.
    return {
      status: 'success', // Registration itself was a success
      message: 'Registration successful, but automatic sign-in encountered an unexpected error.',
      data: null,
      error: {
        code: 'POST_REGISTRATION_SIGN_IN_ERROR',
        message: 'Automatic sign-in failed unexpectedly after registration.',
        details: { originalError: error },
      },
    };
  }
}

// --- START INLINED ERROR HELPERS ---

interface TranslatedErrorPayload {
  code: string;
  message: string;
  originalError?: unknown;
  isFinal?: boolean; // Indicates if this error should be directly shown to user
}

const COMMON_ERROR_MESSAGES: Record<string, string> = {
  GENERIC_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
};

// Specifically for Prisma KnownRequestErrors
function _translatePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): TranslatedErrorPayload {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint failed
      let field = 'field';
      if (error.meta && typeof error.meta.target === 'string') {
        field = error.meta.target;
      } else if (Array.isArray(error.meta?.target)) {
        field = error.meta?.target.join(', ');
      }
      return {
        code: 'UNIQUE_CONSTRAINT_FAILED',
        message: `The value for ${field} already exists. Please use a different value.`,
        originalError: error,
        isFinal: true,
      };
    }
    case 'P2025': // Record to update not found
      return {
        code: 'RECORD_NOT_FOUND',
        message: 'The requested record was not found. It may have been deleted.',
        originalError: error,
        isFinal: true,
      };
    // Add more specific Prisma error codes as needed
    default:
      return {
        code: 'PRISMA_DATABASE_ERROR',
        message: COMMON_ERROR_MESSAGES.DATABASE_ERROR,
        originalError: error,
      };
  }
}

function helper_translateGenericError(error: Error): TranslatedErrorPayload {
  // Simple generic error translation
  // You might want to check error.name or instanceof for more specific built-in errors
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: COMMON_ERROR_MESSAGES.NETWORK_ERROR,
      originalError: error,
    };
  }
  // Default to a generic server error
  return {
    code: 'GENERIC_SERVER_ERROR',
    message: COMMON_ERROR_MESSAGES.GENERIC_SERVER_ERROR,
    originalError: error,
  };
}

// --- END INLINED ERROR HELPERS ---
