// NOTE: This utility is designed to handle errors specifically from the Firebase SDK.
// It is relevant if you choose to integrate Firebase services (e.g., Firebase Auth for social providers not covered by NextAuth, Firestore, Storage)
// that use the Firebase client SDK. It is not directly used by the core NextAuth.js + Prisma authentication flow.

import { FirebaseError } from '@firebase/util';
import { logger } from '@/lib/logger';

type FirebaseAuthErrorCode =
  | 'auth/invalid-email'
  | 'auth/wrong-password'
  | 'auth/user-not-found'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/account-exists-with-different-credential'
  | 'auth/popup-closed-by-user'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/cancelled-popup-request'
  | 'auth/expired-action-code'
  | 'auth/popup-blocked'
  | 'auth/unauthorized-domain'
  | string;

/**
 * A mapping of Firebase Auth error codes to user-friendly error messages
 * (Relevant for optional Firebase SDK usage)
 */
const AUTH_ERROR_MESSAGES: Record<FirebaseAuthErrorCode, string> = {
  'auth/invalid-email': 'The email address is not valid.',
  'auth/wrong-password': 'The password is invalid for the given email.',
  'auth/user-not-found': 'No user found with this email address.',
  'auth/email-already-in-use': 'An account already exists with this email address.',
  'auth/weak-password': 'The password must be at least 6 characters long.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email but different sign-in credentials.',
  'auth/popup-closed-by-user': 'The sign-in popup was closed before completing authentication.',
  'auth/network-request-failed':
    'A network error occurred. Please check your connection and try again.',
  'auth/too-many-requests':
    'Too many failed login attempts. Please try again later or reset your password.',
  'auth/cancelled-popup-request':
    'The authentication operation was cancelled by another conflicting popup.',
  'auth/expired-action-code': 'The action code has expired. Please request a new one.',
  'auth/popup-blocked':
    'The sign-in popup was blocked by your browser. Please allow popups for this site.',
  'auth/unauthorized-domain':
    'This domain is not authorized for OAuth operations. Please contact support.',
};

/**
 * Extracts a user-friendly error message from a Firebase Auth error
 * (Relevant for optional Firebase SDK usage)
 * @param error The error object thrown by Firebase
 * @returns A user-friendly error message string
 */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  // If the error is a Firebase error with a code
  if (error instanceof FirebaseError && error.code) {
    // Return the predefined message if available
    if (error.code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[error.code as FirebaseAuthErrorCode];
    }

    // For any other Firebase auth errors, return a formatted message
    if (error.code.startsWith('auth/')) {
      const errorMessage = error.message || '';
      return `Authentication error: ${errorMessage.replace('Firebase: ', '')}`;
    }
  }

  // For non-Firebase errors or errors without codes/messages
  return 'An unexpected authentication error occurred. Please try again.';
}

/**
 * Logs Firebase errors with extra context and returns a user-friendly message
 * (Relevant for optional Firebase SDK usage)
 * @param context The context where the error occurred (e.g., 'Sign In', 'Profile Update')
 * @param error The error object
 * @returns A user-friendly error message string
 */
export function handleFirebaseError(
  error: unknown,
  context: string = 'Firebase operation'
): string {
  let errorMessage = 'An unknown error occurred';

  if (error instanceof FirebaseError) {
    // Get a readable error message
    errorMessage = getFirebaseAuthErrorMessage(error);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Log the detailed error using Pino
  logger.error(
    {
      err:
        error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      context,
      processedMessage: errorMessage,
    },
    `Firebase Error: ${context}`
  );

  return errorMessage;
}
