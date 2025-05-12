// Removed max-lines disable comment as it's no longer needed
// import { Prisma } from '@prisma/client'; // Removed unused import
import { ServiceError } from '@/types';
// Assuming logger might be needed later, keep import
import { logger as rootLogger } from '@/lib/logger';

// Define the expected structure for the return value of translation functions
// This matches the structure used within ServiceResponse.error
interface TranslatedErrorPayload {
  message: string;
  code: string;
}

// Firebase Auth Error Codes and Messages (Simplified mapping)
const firebaseAuthErrorMap: Record<string, TranslatedErrorPayload> = {
  'auth/email-already-exists': {
    message: 'This email address is already registered.',
    code: 'auth/email-already-exists',
  },
  // ... other mappings ...
  'auth/invalid-password': {
    message: 'Password must be at least 6 characters long.',
    code: 'auth/invalid-password',
  },
  'auth/user-not-found': {
    message: 'No user found with this email address.',
    code: 'auth/user-not-found',
  },
  'auth/wrong-password': {
    message: 'Incorrect password.',
    code: 'auth/wrong-password',
  },
  'auth/too-many-requests': {
    message:
      'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.',
    code: 'auth/too-many-requests',
  },
};

// Type guard for Firebase Auth-like errors (checking for a 'code' property)
interface FirebaseAuthErrorLike {
  code?: unknown;
}

function isFirebaseAuthErrorLike(error: unknown): error is FirebaseAuthErrorLike {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Translates Firebase authentication error codes into user-friendly messages and standard codes.
 * Uses 'unknown' for broader compatibility but performs checks internally.
 */
export function _translateFirebaseAuthError(error: unknown): TranslatedErrorPayload {
  if (isFirebaseAuthErrorLike(error) && typeof error.code === 'string') {
    return (
      firebaseAuthErrorMap[error.code] || {
        message: 'An unexpected authentication error occurred.',
        code: 'auth/unknown-error',
      }
    );
  }
  // Handle cases where error is not an object or doesn't have a string code
  return {
    message: 'An unexpected authentication error occurred (invalid format).',
    code: 'auth/invalid-error-format',
  };
}

// Prisma Error related types and functions

// Interface describing the structure of Prisma errors we care about
export interface PrismaErrorWithCodeAndMeta extends Error {
  code?: string;
  meta?: Record<string, unknown>;
  clientVersion?: string;
}

function isObject(value: unknown): value is Record<string | number | symbol, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard to check if an error object resembles a Prisma error.
 * Focuses on properties commonly found in Prisma known/unknown request errors.
 */
export function isPrismaError(error: unknown): error is PrismaErrorWithCodeAndMeta {
  if (!(error instanceof Error)) {
    return false;
  }
  // Safer check for clientVersion without using `any`
  const hasClientVersion =
    isObject(error) &&
    typeof error.clientVersion === 'string' &&
    error.clientVersion.includes('prisma');

  // Check for properties common to Prisma errors (code is essential, meta/clientVersion are helpful)
  return (
    'code' in error ||
    'meta' in error ||
    hasClientVersion || // Use the safer check
    error.name.startsWith('PrismaClient') // Check error name prefix
  );
}

// Helper specifically for P2002 errors
function _handlePrismaP2002(error: PrismaErrorWithCodeAndMeta): TranslatedErrorPayload | null {
  const meta = error.meta;
  if (meta?.target && Array.isArray(meta.target) && meta.target.includes('email')) {
    return {
      message: 'This email address is already in use.',
      code: 'PRISMA_P2002_EMAIL',
    };
  } else {
    // Generic unique constraint violation
    return {
      message: 'A unique constraint was violated.',
      code: 'PRISMA_P2002_UNKNOWN_TARGET',
    };
  }
}

/**
 * Translates known Prisma error codes into user-friendly messages and standard codes.
 */
export function _translatePrismaError(error: PrismaErrorWithCodeAndMeta): TranslatedErrorPayload {
  const code = error.code;

  if (code === 'P2002') {
    const p2002Result = _handlePrismaP2002(error);
    if (p2002Result) return p2002Result; // Should always return from helper, but check anyway
  }

  if (code) {
    // For other known Prisma codes, use the original message but the code itself
    return {
      message: error.message || 'A database error occurred.',
      code: code, // Use the specific P-code
    };
  }

  // Fallback for Prisma errors without a specific code (e.g., connection errors sometimes)
  // Try to derive a code from the error name
  const nameCode = error.name
    ?.replace(/([A-Z])/g, (_match, letter, offset) => (offset > 0 ? '_' : '') + letter) // Avoid leading underscore
    .toUpperCase()
    .replace(/^PRISMA_CLIENT_/, 'PRISMA_'); // Shorten prefix

  return {
    message: error.message || 'An unknown database error occurred.',
    code: nameCode || 'PRISMA_UNKNOWN_ERROR',
  };
}

// Generic Error Translation

/**
 * Translates generic JavaScript Error objects.
 */
export function _translateGenericError(error: Error): TranslatedErrorPayload {
  let code = 'GENERIC_ERROR';
  // Attempt to use a more specific code from the error name if it's not just 'Error'
  if (error.name && error.name !== 'Error') {
    code = error.name.toUpperCase().replace(/ /g, '_');
  }
  return {
    message: error.message || 'An unexpected error occurred.',
    code,
  };
}

// Combined Registration Error Translation

/**
 * Central function to translate various errors that might occur during registration.
 */
export function _translateRegistrationError(error: unknown): TranslatedErrorPayload {
  if (error instanceof ServiceError && error.code) {
    // If it's already a ServiceError with a code, trust it.
    return { message: error.message, code: error.code };
  }
  if (isPrismaError(error)) {
    return _translatePrismaError(error);
  }
  if (isFirebaseAuthErrorLike(error)) {
    // Attempt Firebase translation based on code property
    return _translateFirebaseAuthError(error);
  }
  if (error instanceof Error) {
    return _translateGenericError(error);
  }

  // Fallback for completely unknown errors
  rootLogger.error({ error }, 'Unknown error type encountered in _translateRegistrationError');
  return {
    message: 'An unexpected error occurred during registration.',
    code: 'UNKNOWN_REGISTRATION_ERROR',
  };
}

// Define and export a custom error class for rollback scenarios
export class RollbackError extends Error {
  public readonly originalError: unknown;
  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = 'RollbackError';
    this.originalError = originalError;
    // Ensure prototype chain is correct for instanceof checks
    Object.setPrototypeOf(this, RollbackError.prototype);
  }
}
