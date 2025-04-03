import { getFirebaseAuthErrorMessage } from '../../../lib/utils/firebase-errors';
import { FirebaseError } from '@firebase/util';

describe('Firebase Error Utilities', () => {
  describe('getFirebaseAuthErrorMessage', () => {
    test('should return correct message for invalid-email error', () => {
      const error = new FirebaseError(
        'auth/invalid-email',
        'Firebase: Error (auth/invalid-email).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe('The email address is not valid.');
    });

    test('should return correct message for wrong-password error', () => {
      const error = new FirebaseError(
        'auth/wrong-password',
        'Firebase: Error (auth/wrong-password).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The password is invalid for the given email.'
      );
    });

    test('should return correct message for user-not-found error', () => {
      const error = new FirebaseError(
        'auth/user-not-found',
        'Firebase: Error (auth/user-not-found).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe('No user found with this email address.');
    });

    test('should return correct message for email-already-in-use error', () => {
      const error = new FirebaseError(
        'auth/email-already-in-use',
        'Firebase: Error (auth/email-already-in-use).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'An account already exists with this email address.'
      );
    });

    test('should return correct message for weak-password error', () => {
      const error = new FirebaseError(
        'auth/weak-password',
        'Firebase: Error (auth/weak-password).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The password must be at least 6 characters long.'
      );
    });

    test('should return correct message for account-exists-with-different-credential error', () => {
      const error = new FirebaseError(
        'auth/account-exists-with-different-credential',
        'Firebase: Error (auth/account-exists-with-different-credential).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'An account already exists with the same email but different sign-in credentials.'
      );
    });

    test('should return correct message for popup-closed-by-user error', () => {
      const error = new FirebaseError(
        'auth/popup-closed-by-user',
        'Firebase: Error (auth/popup-closed-by-user).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The sign-in popup was closed before completing authentication.'
      );
    });

    test('should return correct message for network-request-failed error', () => {
      const error = new FirebaseError(
        'auth/network-request-failed',
        'Firebase: Error (auth/network-request-failed).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'A network error occurred. Please check your connection and try again.'
      );
    });

    test('should return correct message for too-many-requests error', () => {
      const error = new FirebaseError(
        'auth/too-many-requests',
        'Firebase: Error (auth/too-many-requests).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'Too many failed login attempts. Please try again later or reset your password.'
      );
    });

    test('should return correct message for cancelled-popup-request error', () => {
      const error = new FirebaseError(
        'auth/cancelled-popup-request',
        'Firebase: Error (auth/cancelled-popup-request).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The authentication operation was cancelled by another conflicting popup.'
      );
    });

    test('should return correct message for expired-action-code error', () => {
      const error = new FirebaseError(
        'auth/expired-action-code',
        'Firebase: Error (auth/expired-action-code).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The action code has expired. Please request a new one.'
      );
    });

    test('should return correct message for popup-blocked error', () => {
      const error = new FirebaseError(
        'auth/popup-blocked',
        'Firebase: Error (auth/popup-blocked).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'The sign-in popup was blocked by your browser. Please allow popups for this site.'
      );
    });

    test('should return correct message for unauthorized-domain error', () => {
      const error = new FirebaseError(
        'auth/unauthorized-domain',
        'Firebase: Error (auth/unauthorized-domain).'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'This domain is not authorized for OAuth operations. Please contact support.'
      );
    });

    test('should return the error message for unknown Firebase Auth errors', () => {
      const error = new FirebaseError(
        'auth/some-unknown-error',
        'Firebase: This is a custom error message.'
      );
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'Authentication error: This is a custom error message.'
      );
    });

    test('should return a generic message for non-Firebase errors', () => {
      const error = new Error('This is a generic error');
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'An unexpected authentication error occurred. Please try again.'
      );
    });

    test('should handle error objects without messages', () => {
      const error = { code: 'auth/timeout' } as unknown as Error;
      expect(getFirebaseAuthErrorMessage(error)).toBe(
        'An unexpected authentication error occurred. Please try again.'
      );
    });
  });
});
