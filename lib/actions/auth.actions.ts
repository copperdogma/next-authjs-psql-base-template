'use server'; // Restore directive

/* eslint-disable max-lines -- Disabled: This file contains multiple related server actions 
   (registration, credentials auth) and their associated helper functions. 
   Significant refactoring has already been done to break down logic internally. 
   Further splitting might reduce clarity and cohesion more than the length limit warrants. */

import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import * as admin from 'firebase-admin';
import pino from 'pino';

import { logger as rootLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';
import { firebaseAdminServiceImpl } from '@/lib/server/services/firebase-admin.service';
import { signIn } from '@/lib/auth-node';

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

// Result type returned by the server action wrapper
interface RegistrationResult {
  success: boolean;
  message?: string;
  error?: string; // Optional error code/key
  user?: User; // Can be included but often omitted in final action result
}

// Structure expected by _performRegistrationAttempt
interface PerformRegistrationDeps {
  db: RegisterUserDbClient;
  hasher: Hasher;
  fbService: FirebaseAdminServiceInterface;
}

// Interface for optional dependencies passed into the main action logic
interface RegisterUserOptionalDeps {
  db?: RegisterUserDbClient;
  hasher?: Hasher;
  fbService?: FirebaseAdminServiceInterface;
  logger?: pino.Logger;
}

// --- Private Helper Functions --- //

function _validateRegistrationInput(
  formData: FormData
): z.SafeParseReturnType<RegistrationInput, RegistrationInput> {
  const rawFormData = Object.fromEntries(formData.entries());
  return RegistrationSchema.safeParse(rawFormData);
}

async function _createFirebaseUser(
  data: { email: string; password?: string; name?: string | null },
  fbService: FirebaseAdminServiceInterface,
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
  services: { db: RegisterUserDbClient; hasher: Hasher },
  logContext: { email?: string | null; uid: string }
): Promise<User> {
  const { db, hasher } = services;
  actionLogger.debug(logContext, '_createPrismaUser: Hashing password...');
  const hashedPassword = await hasher.hash(passwordToHash, SALT_ROUNDS);
  actionLogger.debug(logContext, '_createPrismaUser: Attempting DB create...');
  try {
    const prismaUser = await db.user.create({
      data: {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        hashedPassword,
        emailVerified: firebaseUser.emailVerified ? new Date() : null,
      },
    });
    actionLogger.info({ ...logContext, userId: prismaUser.id }, '_createPrismaUser: Success');
    return prismaUser;
  } catch (dbError) {
    actionLogger.error({ ...logContext, error: dbError }, '_createPrismaUser: FAILED');
    throw dbError;
  }
}

// Helper to handle Prisma user creation failure and attempt Firebase user rollback
async function _handlePrismaCreateFailure(
  firebaseUser: admin.auth.UserRecord, // Must be non-null here
  fbService: FirebaseAdminServiceInterface,
  baseLogContext: { email?: string | null },
  originalDbError: unknown // Keep a reference to the original DB error for context if needed
): Promise<never> {
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
    // Throw a specific error indicating DB failure and successful rollback
    throw new Error('Database user creation failed. Associated Firebase user was rolled back.');
  } catch (rollbackError) {
    actionLogger.error(
      { ...baseLogContext, firebaseUid: firebaseUser.uid, error: rollbackError },
      '_createUser: FAILED to roll back (delete) Firebase user. Manual cleanup may be required.'
    );
    // Throw a specific error indicating DB failure AND rollback failure
    throw new Error(
      'Database user creation failed, AND failed to roll back Firebase user. Manual cleanup required.'
    );
  }
}

async function _createUser(
  data: RegistrationInput,
  db: RegisterUserDbClient,
  hasher: Hasher,
  fbService: FirebaseAdminServiceInterface
): Promise<User> {
  const { email, password } = data;
  const baseLogContext = { email };
  let firebaseUser: admin.auth.UserRecord | null = null;

  try {
    firebaseUser = await _createFirebaseUser(data, fbService, baseLogContext);
    const prismaLogContext = { email: firebaseUser.email, uid: firebaseUser.uid };
    const prismaUser = await _createPrismaUser(
      firebaseUser,
      password,
      { db, hasher },
      prismaLogContext
    );
    return prismaUser;
  } catch (error) {
    actionLogger.error(
      { ...baseLogContext, error, firebaseUidAttempted: firebaseUser?.uid },
      '_createUser: Error during user creation process.'
    );
    if (firebaseUser) {
      // Prisma creation failed after Firebase user was made. Delegate to rollback handler.
      // This function always throws, so _createUser effectively throws here too.
      return await _handlePrismaCreateFailure(firebaseUser, fbService, baseLogContext, error);
    } else {
      // Error occurred during Firebase user creation itself, or before firebaseUser was assigned.
      throw error; // Re-throw the original error for upstream translation.
    }
  }
}

interface PrismaErrorWithCodeAndMeta {
  code?: string;
  meta?: { target?: string[] };
}
function isPrismaError(error: unknown): error is PrismaErrorWithCodeAndMeta {
  return typeof error === 'object' && error !== null && ('code' in error || 'meta' in error);
}

async function _signInAfterRegistration(
  newUser: User,
  passwordAttempt: string,
  logContext: { email: string; userId: string }
): Promise<RegistrationResult> {
  try {
    actionLogger.info(logContext, '_signInAfterRegistration: Attempting sign-in...');
    await signIn('credentials', {
      email: newUser.email,
      password: passwordAttempt,
      redirect: false,
    });
    actionLogger.info(logContext, '_signInAfterRegistration: Sign-in successful.');
    return { success: true, message: 'Registration and login successful!', user: newUser };
  } catch (signInError: unknown) {
    actionLogger.error({ ...logContext, signInError }, '_signInAfterRegistration: Sign-in FAILED');
    let signInErrorMessage = 'Registration succeeded, but automatic login failed.';
    if (signInError instanceof Error) {
      signInErrorMessage += ` Error: ${signInError.message}`;
    }
    return {
      success: false,
      message: signInErrorMessage,
      error: 'POST_REGISTRATION_SIGNIN_FAILED',
    };
  }
}

// Helper function to translate Firebase Auth errors
function _translateFirebaseAuthError(code: string): { message: string; code: string } {
  switch (code) {
    case 'auth/email-already-exists':
      return { message: 'This email address is already registered.', code };
    case 'auth/invalid-password':
      return { message: 'Password must be at least 6 characters long.', code };
    // Add more specific Firebase error codes here if needed
    default:
      return { message: 'An unexpected Firebase authentication error occurred.', code };
  }
}

// Helper function to translate Prisma errors (specifically unique constraint)
function _translatePrismaError(error: PrismaErrorWithCodeAndMeta): {
  message: string;
  code: string;
} {
  if (error.code === 'P2002') {
    // Could check error.meta.target to be more specific if needed (e.g., email_unique)
    return { message: 'This email address is already registered.', code: 'PRISMA_P2002' };
  }
  // Handle other Prisma errors if necessary
  return {
    message: 'A database error occurred during registration.',
    code: error.code || 'PRISMA_UNKNOWN',
  };
}

// Helper function to translate generic errors
function _translateGenericError(error: Error): { message: string; code: string } {
  const errorCode = error.name === 'Error' ? 'GENERIC_ERROR' : error.name;
  return { message: error.message || 'An unexpected error occurred.', code: errorCode };
}

function _translateRegistrationError(error: unknown): { message: string; code: string } {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    if (typeof errorCode === 'string' && errorCode.startsWith('auth/')) {
      return _translateFirebaseAuthError(errorCode);
    } else if (isPrismaError(error)) {
      return _translatePrismaError(error);
    }
    // Fallthrough for other object errors with a 'code' property
  }

  if (error instanceof Error) {
    return _translateGenericError(error);
  }

  // Fallback for completely unknown errors
  return { message: 'An unknown error occurred during registration.', code: 'UNKNOWN_ERROR' };
}

function _handleRegistrationError(
  error: unknown,
  logContext: { email: string }
): RegistrationResult {
  // Return RegistrationResult directly
  actionLogger.error({ ...logContext, error }, '_handleRegistrationError');
  const { message: translatedMessage, code: translatedCode } = _translateRegistrationError(error);
  return {
    success: false,
    message: translatedMessage,
    error: translatedCode,
  };
}

async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: PerformRegistrationDeps,
  logContext: { email: string }
): Promise<RegistrationResult> {
  // Correct return type
  const { db, hasher, fbService } = services;
  try {
    const newUser = await _createUser(validatedData, db, hasher, fbService);
    return await _signInAfterRegistration(newUser, validatedData.password, {
      ...logContext,
      userId: newUser.id,
    });
  } catch (error) {
    actionLogger.error({ ...logContext, error }, '_performRegistrationAttempt: FAILED');
    return _handleRegistrationError(error, logContext);
  }
}

// --- Main Logic Entry Point (Refactored dependencies) --- //
export async function registerUserLogic(
  formData: FormData,
  deps?: RegisterUserOptionalDeps
): Promise<RegistrationResult> {
  const currentLogger = deps?.logger ?? actionLogger.child({ email: '?' }); // Default child logger
  currentLogger.info('registerUserLogic: Starting registration attempt...');

  // Default dependencies
  const defaultDbService: RegisterUserDbClient = prisma;
  const defaultHasher: Hasher = { hash };
  // Use the correctly imported implementation instance
  const defaultFbService: FirebaseAdminServiceInterface = firebaseAdminServiceImpl;

  // Correct return type
  const validationResult = _validateRegistrationInput(formData);

  if (!validationResult.success) {
    currentLogger.warn(
      { errors: validationResult.error.flatten() },
      'registerUserLogic: Invalid form data'
    );
    return {
      success: false,
      message: 'Invalid registration data.',
      error: 'VALIDATION_FAILED',
    };
  }

  const validatedData = validationResult.data;
  const logContext = { email: validatedData.email };

  // Prepare dependencies for the core logic, now knowing fbService is defined
  const coreDeps: PerformRegistrationDeps = {
    db: defaultDbService,
    hasher: defaultHasher,
    fbService: defaultFbService, // Pass the defined service
  };

  return _performRegistrationAttempt(validatedData, coreDeps, logContext);
}

// --- Server Action Wrapper --- //
export async function registerUserAction(
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  actionLogger.info('registerUserAction: Received request');
  try {
    const result = await registerUserLogic(formData);
    if (result.success) {
      actionLogger.info({ email: result.user?.email }, 'registerUserAction: Success');
    } else {
      actionLogger.warn(
        { email: formData.get('email') as string, error: result.error, message: result.message },
        'registerUserAction: Failed'
      );
    }
    return { success: result.success, message: result.message };
  } catch (error: unknown) {
    actionLogger.error({ error }, 'registerUserAction: UNEXPECTED Exception');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected server error occurred.',
    };
  }
}

// --- Authentication Logic --- //

function _validateAuthInput(email?: string | null, password?: string | null): boolean {
  return !!email && !!password;
}

interface AuthErrorCause {
  err?: Error;
}

interface PossibleAuthError {
  type?: string;
  cause?: AuthErrorCause;
}

function isPossibleAuthError(error: unknown): error is PossibleAuthError {
  return typeof error === 'object' && error !== null;
}

// Helper to handle specific AuthError types from NextAuth
function _handleNextAuthErrorType(
  error: PossibleAuthError,
  logContext: { email: string | null }
): { message: string } {
  const errorType = error.type;
  actionLogger.warn(
    { ...logContext, errorType: errorType, errorCause: error.cause },
    '[authenticateWithCredentials] Authentication error detected (has type property)'
  );
  switch (errorType) {
    case 'CredentialsSignin':
      return { message: 'Invalid email or password.' };
    case 'CallbackRouteError':
      const causeMessage = error.cause?.err?.message ?? 'Callback configuration error';
      return { message: `Login failed: ${causeMessage}` };
    default:
      actionLogger.warn(
        { ...logContext, errorType: errorType },
        '[authenticateWithCredentials] Unhandled AuthError type property'
      );
      return { message: 'An authentication error occurred. Please try again.' };
  }
}

function _handleAuthError(
  error: unknown,
  logContext: { email: string | null }
): { message: string } {
  if (error == null) {
    actionLogger.error(
      { ...logContext },
      '[authenticateWithCredentials] _handleAuthError called with null or undefined error'
    );
    return { message: 'An unexpected empty error occurred during login.' };
  }

  // Handle NEXT_REDIRECT first
  if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
    actionLogger.info(logContext, '[authenticateWithCredentials] Redirect initiated.');
    throw error;
  }

  // Handle specific NextAuth error types
  if (isPossibleAuthError(error) && error.type) {
    return _handleNextAuthErrorType(error, logContext);
  }

  // Handle generic JS Errors
  if (error instanceof Error) {
    actionLogger.error(
      { ...logContext, errorName: error.name, errorMessage: error.message },
      '[authenticateWithCredentials] Standard Error encountered'
    );
    return { message: 'An unexpected error occurred during login.' };
  }

  // Handle anything else
  actionLogger.error(
    { ...logContext, errorDetails: String(error) },
    '[authenticateWithCredentials] Unexpected non-Error type thrown'
  );
  return { message: 'An unexpected server error occurred during login.' };
}

export async function authenticateWithCredentials(
  formData: FormData
): Promise<{ message: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const logContext = { email };

  actionLogger.info(logContext, '[authenticateWithCredentials] Attempting login');

  if (!_validateAuthInput(email, password)) {
    actionLogger.warn(logContext, '[authenticateWithCredentials] Missing email or password');
    return { message: 'Email and password are required.' };
  }

  try {
    actionLogger.debug(logContext, '[authenticateWithCredentials] Calling signIn...');
    await signIn('credentials', { email, password, redirect: false });
    actionLogger.info(
      logContext,
      '[authenticateWithCredentials] signIn completed successfully (no error caught)'
    );
    return { message: 'Login successful (pending redirect).' };
  } catch (error: unknown) {
    return _handleAuthError(error, logContext);
  }
}
