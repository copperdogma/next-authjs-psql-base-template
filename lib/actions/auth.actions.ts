'use server'; // Restore directive

/* eslint-disable max-lines -- Disabled: This file contains multiple related server actions 
   (registration, credentials auth) and their associated helper functions. 
   Significant refactoring has already been done to break down logic internally. 
   Further splitting might reduce clarity and cohesion more than the length limit warrants. */

import { hash } from 'bcryptjs';
import { z } from 'zod';
import { User } from '@prisma/client'; // Explicitly import User type
import * as admin from 'firebase-admin';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';
import { firebaseAdminService } from '@/lib/server/services';
import { signIn } from '@/lib/auth-node';
import { logger as utilsLogger } from '@/lib/logger';

// Constants
const SALT_ROUNDS = 10; // Recommended salt rounds for bcryptjs

// Logger instance specific to auth actions
const actionLogger = logger.child({ module: 'auth-actions' });

// --- Schemas ---
const RegistrationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

type RegistrationInput = z.infer<typeof RegistrationSchema>;

// --- Interfaces for Dependency Injection / Testing ---
interface RegisterUserDbClient {
  user: {
    findUnique: typeof prisma.user.findUnique;
    create: typeof prisma.user.create;
  };
}

interface Hasher {
  hash: (password: string, saltOrRounds: number) => Promise<string>;
}

// --- Private Helper Functions for registerUserLogic ---

function _validateRegistrationInput(
  formData: FormData
): z.SafeParseReturnType<RegistrationInput, RegistrationInput> {
  const rawFormData = Object.fromEntries(formData.entries());
  return RegistrationSchema.safeParse(rawFormData);
}

async function _checkExistingUser(email: string, db: RegisterUserDbClient): Promise<boolean> {
  const existingUser = await db.user.findUnique({
    where: { email },
  });
  return !!existingUser;
}

// --- Extracted Helper for Firebase User Creation ---
async function _createFirebaseUser(
  data: { email: string; password?: string; name?: string | null }, // Use specific fields needed
  fbService: FirebaseAdminServiceInterface,
  logContext: { email: string }
): Promise<admin.auth.UserRecord> {
  actionLogger.debug(logContext, '_createFirebaseUser: Attempting...');
  try {
    const firebaseUser = await fbService.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });
    actionLogger.info({ ...logContext, uid: firebaseUser.uid }, '_createFirebaseUser: Success');
    return firebaseUser;
  } catch (error) {
    actionLogger.error({ ...logContext, error }, '_createFirebaseUser: FAILED');
    throw error; // Re-throw to be caught by caller
  }
}

// --- Extracted Helper for Prisma User Creation ---
async function _createPrismaUser(
  firebaseUser: admin.auth.UserRecord,
  passwordToHash: string,
  services: { db: RegisterUserDbClient; hasher: Hasher },
  logContext: { email?: string | null; uid: string }
): Promise<User> {
  const { db, hasher } = services; // Destructure inside
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
    actionLogger.error(logContext, '_createPrismaUser: FAILED');
    throw dbError; // Re-throw to be caught by caller
  }
}

// --- Original _createUser Function (Refactored) ---
async function _createUser(
  data: RegistrationInput,
  db: RegisterUserDbClient,
  hasher: Hasher,
  fbService: FirebaseAdminServiceInterface
): Promise<User> {
  const { email, password } = data;
  const baseLogContext = { email };

  // 1. Create Firebase user using helper
  const firebaseUser = await _createFirebaseUser(data, fbService, baseLogContext);

  // 2. Create Prisma user using helper
  const prismaLogContext = { email: firebaseUser.email, uid: firebaseUser.uid };
  const prismaUser = await _createPrismaUser(
    firebaseUser,
    password, // Pass original password for hashing
    { db, hasher }, // Pass services object
    prismaLogContext
  );

  return prismaUser;
}

// Type guard for Prisma errors
interface PrismaErrorWithCodeAndMeta {
  code?: string;
  meta?: { target?: string[] };
}
function isPrismaError(error: unknown): error is PrismaErrorWithCodeAndMeta {
  return typeof error === 'object' && error !== null && ('code' in error || 'meta' in error);
}

// --- Public Registration Logic (Refactored) ---

// --- Private Helper Functions for registerUserLogic (Refactored) ---

type RegistrationResult = Promise<{
  success: boolean;
  message?: string;
  user?: User;
  error?: string;
}>;

// --- Helper for Post-Registration Sign-in ---
async function _signInAfterRegistration(
  newUser: User,
  passwordAttempt: string, // The original password attempt
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

// --- Extracted Helper for Error Translation ---
function _translateRegistrationError(error: unknown): { message: string; code: string } {
  let errorMessage = 'An error occurred during registration.';
  let errorCode = 'UNKNOWN_ERROR';

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const firebaseErrorCode = (error as { code: string }).code;
    errorCode = firebaseErrorCode;
    switch (firebaseErrorCode) {
      case 'auth/email-already-exists':
        errorMessage = 'This email address is already registered.';
        break;
      case 'auth/invalid-password':
        errorMessage = 'Password must be at least 6 characters long.';
        break;
      default:
        errorMessage = 'An unexpected Firebase error occurred.';
        break;
    }
  } else if (isPrismaError(error) && error.code === 'P2002') {
    errorMessage = 'An unexpected database conflict occurred.';
    errorCode = 'PRISMA_P2002';
  }

  return { message: errorMessage, code: errorCode };
}

// --- Core Registration Logic ---
async function _performRegistrationAttempt(
  validatedData: RegistrationInput,
  services: {
    db: RegisterUserDbClient;
    hasher: Hasher;
    fbService: FirebaseAdminServiceInterface;
  },
  logContext: { email: string }
): RegistrationResult {
  const { email, password } = validatedData;
  const { db, hasher, fbService } = services; // Destructure services

  if (await _checkExistingUser(email, db)) {
    actionLogger.warn(logContext, 'Registration attempt for existing email');
    return { success: false, message: 'Email already in use.' };
  }

  try {
    const newUser = await _createUser(validatedData, db, hasher, fbService);
    const signInLogContext = { ...logContext, userId: newUser.id };
    actionLogger.info(
      signInLogContext,
      '_performRegistrationAttempt: User registered successfully'
    );

    // Call the extracted sign-in helper function
    return await _signInAfterRegistration(newUser, password, signInLogContext);
  } catch (error) {
    // Catch errors from _createUser
    actionLogger.warn({ ...logContext, error }, '_performRegistrationAttempt: _createUser failed');

    // Use the extracted error translation helper
    const { message: translatedMessage, code: translatedCode } = _translateRegistrationError(error);

    actionLogger.error(
      { ...logContext, errorCode: translatedCode, originalError: error },
      '_performRegistrationAttempt: Returning failure from _createUser catch'
    );
    // Return using the translated message and code
    return { success: false, message: translatedMessage, error: translatedCode };
  }
}

function _handleRegistrationError(
  error: unknown,
  logContext: { email: string }
): { success: boolean; message?: string; error?: string } {
  const logPayload = {
    ...logContext,
    error: error instanceof Error ? error.message : String(error),
  };
  if (isPrismaError(error) && error.code === 'P2002' && error.meta?.target?.includes('email')) {
    logger.warn(logPayload, 'Registration conflict: Email already exists (DB constraint)');
    return { success: false, error: 'User already exists' };
  }
  // Default to database error for any other catch
  logger.error(logPayload, 'Database error during registration');
  return { success: false, error: 'Database error occurred during registration.' };
}

// --- Main Public Registration Logic ---
export async function registerUserLogic(
  formData: FormData,
  db: RegisterUserDbClient
): RegistrationResult {
  // Explicit return type
  actionLogger.info('registerUser logic called');

  const validatedFields = _validateRegistrationInput(formData);
  if (!validatedFields.success) {
    // Refined error extraction for type safety
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstErrorKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors | undefined;
    const firstErrorMessage = firstErrorKey ? fieldErrors[firstErrorKey]?.[0] : undefined;
    const finalMessage = firstErrorMessage || 'Invalid input.';
    actionLogger.warn('Registration validation failed', { errors: fieldErrors });
    return { success: false, message: finalMessage };
  }

  const { email } = validatedFields.data;
  const logContext = { email };

  try {
    // Delegate the core logic, passing services as an object
    return await _performRegistrationAttempt(
      validatedFields.data,
      { db, hasher: { hash }, fbService: firebaseAdminService }, // Group services
      logContext
    );
  } catch (error: unknown) {
    // Delegate error handling to the helper function
    // Note: _performRegistrationAttempt now handles its own errors, so this catch
    // might only catch very unexpected issues. _handleRegistrationError might be redundant now.
    actionLogger.error(
      { ...logContext, error },
      'registerUserLogic: Unexpected error caught at top level'
    );
    return _handleRegistrationError(error, logContext);
  }
}

// --- Server Action Wrapper ---

export async function registerUserAction(formData: FormData) {
  // Remove fbService argument from the call
  const result = await registerUserLogic(formData, prisma);
  utilsLogger.info({ result }, 'registerUserAction: Returning result');
  return result;
}

// --- Authentication Logic ---

// --- Private Helper Functions for authenticateWithCredentials ---

function _validateAuthInput(email?: string | null, password?: string | null): boolean {
  return !!email && !!password;
}

// Define a more specific type for the error cause if possible
interface AuthErrorCause {
  err?: Error; // Standard Error object
}

// Interface describing the structure we expect from NextAuth errors
// based on runtime checks and observed behavior.
interface PossibleAuthError {
  type?: string;
  cause?: AuthErrorCause;
  // Other properties might exist
}

// Type guard to check if an unknown error might be a structured AuthError
function isPossibleAuthError(error: unknown): error is PossibleAuthError {
  return typeof error === 'object' && error !== null;
}

// Function to handle complex error logic from signIn
// eslint-disable-next-line complexity -- Refactored slightly, but still complex due to error types
function _handleAuthError(
  error: unknown,
  logContext: { email: string | null }
): { message: string } {
  // Handle edge case where catch might be triggered with undefined/null
  if (error == null) {
    // Checks for both null and undefined
    logger.error(
      { ...logContext },
      '[authenticateWithCredentials] _handleAuthError called with null or undefined error'
    );
    return { message: 'An unexpected empty error occurred during login.' }; // Specific message for this case
  }

  // Check for NEXT_REDIRECT first, as it should be re-thrown
  if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
    logger.info(logContext, '[authenticateWithCredentials] Redirect initiated.');
    throw error; // Re-throw the specific error
  }

  // Check for specific AuthError types first using the type property
  if (isPossibleAuthError(error) && error.type) {
    const errorType = error.type;
    logger.warn(
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
        logger.warn(
          { ...logContext, errorType: errorType },
          '[authenticateWithCredentials] Unhandled AuthError type property'
        );
        return { message: 'An authentication error occurred. Please try again.' };
    }
  }

  // If it wasn't an AuthError-like object, check if it's a standard Error
  if (error instanceof Error) {
    logger.error(
      { ...logContext, errorName: error.name, errorMessage: error.message },
      '[authenticateWithCredentials] Standard Error encountered'
    );
    return { message: 'An unexpected error occurred during login.' };
  }

  // Handle/log truly unexpected non-Error types and return generic server error
  logger.error(
    { ...logContext, errorDetails: String(error) },
    '[authenticateWithCredentials] Unexpected non-Error type thrown'
  );
  return { message: 'An unexpected server error occurred during login.' };
}

// --- Public Authentication Action (Refactored) ---

export async function authenticateWithCredentials(
  formData: FormData
): Promise<{ message: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const logContext = { email };

  logger.info(logContext, '[authenticateWithCredentials] Attempting login');

  if (!_validateAuthInput(email, password)) {
    logger.warn(logContext, '[authenticateWithCredentials] Missing email or password');
    return { message: 'Email and password are required.' };
  }

  try {
    logger.debug(logContext, '[authenticateWithCredentials] Calling signIn...');
    await signIn('credentials', { email, password, redirect: false });
    // If signIn resolves without throwing, log and return success immediately
    logger.info(
      logContext,
      '[authenticateWithCredentials] signIn completed successfully (no error caught)'
    );
    return { message: 'Login successful (pending redirect).' };
  } catch (error: unknown) {
    // If an error was caught, handle it
    return _handleAuthError(error, logContext);
  }
}
