'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from '@firebase/auth';
import type { Auth } from '@firebase/auth';
import { Button } from '../ui/Button';
import { useAuth } from '../../app/providers/AuthProvider';
import { auth, isFirebaseAuth } from '../../lib/firebase';
import { handleFirebaseError } from '../../lib/utils/firebase-errors';

type AuthMode = 'sign-in' | 'sign-out';

export default function SignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buttonLoading, setButtonLoading] = useState(false);
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear error message when auth state changes
  useEffect(() => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [user, errorMessage]);

  // Get the callback URL safely
  const getCallbackUrl = useCallback(() => {
    try {
      return searchParams?.get('callbackUrl') || '/dashboard';
    } catch (error) {
      // Fallback for test environment or if searchParams is not available
      return '/dashboard';
    }
  }, [searchParams]);

  // Unified authentication handler for both sign-in and sign-out
  const handleAuth = useCallback(
    async (mode: AuthMode) => {
      // Clear any previous error
      setErrorMessage(null);

      try {
        setButtonLoading(true);

        // Get the callback URL if it exists
        const callbackUrl = getCallbackUrl();

        if (mode === 'sign-in') {
          if (!isFirebaseAuth(auth)) {
            throw new Error('Firebase Auth not available');
          }

          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();

          await createSession(idToken);

          // Add a delay before redirecting to ensure cookie is set
          await new Promise(resolve => setTimeout(resolve, 300));

          // Use window.location for a full page refresh to ensure cookie is used
          if (typeof window !== 'undefined') {
            window.location.href = callbackUrl;
          }
        } else {
          if (!isFirebaseAuth(auth)) {
            throw new Error('Firebase Auth not available');
          }

          await signOut(auth);
          await deleteSession();

          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      } catch (error) {
        // Get user-friendly error message for display
        const contextName = mode === 'sign-in' ? 'Sign In' : 'Sign Out';
        const userMessage = handleFirebaseError(contextName, error);

        // Set the error message for display
        setErrorMessage(userMessage);
      } finally {
        setButtonLoading(false);
      }
    },
    [getCallbackUrl]
  );

  // Helper functions to handle session API calls
  const createSession = async (idToken: string) => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create session: ${response.status} - ${data.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      // Use our error handling utility with proper context
      handleFirebaseError('Session Creation', error);
      throw error;
    }
  };

  const deleteSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      // Use our error handling utility with proper context
      handleFirebaseError('Session Deletion', error);
      throw error;
    }
  };

  // Memoized event handlers
  const handleSignIn = useCallback(() => handleAuth('sign-in'), [handleAuth]);
  const handleSignOut = useCallback(() => handleAuth('sign-out'), [handleAuth]);

  // Show loading state during server-side rendering or initial auth check
  if (!mounted || loading) {
    return (
      <Button disabled data-testid="auth-button-placeholder">
        Loading...
      </Button>
    );
  }

  // Show button based on authentication state
  const buttonProps = {
    onClick: user ? handleSignOut : handleSignIn,
    disabled: buttonLoading,
    'data-testid': 'auth-button',
    'data-auth-state': user ? 'sign-out' : 'sign-in',
    'data-loading': buttonLoading.toString(),
    'aria-label': user
      ? buttonLoading
        ? 'Signing out...'
        : 'Sign Out'
      : buttonLoading
        ? 'Signing in...'
        : 'Sign In with Google',
  };

  // Determine button text based on state
  const buttonText = user
    ? buttonLoading
      ? 'Signing out...'
      : 'Sign Out'
    : buttonLoading
      ? 'Signing in...'
      : 'Sign In with Google';

  return (
    <div className="flex flex-col">
      <Button {...buttonProps}>{buttonText}</Button>

      {/* Show error message if present */}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-2" role="alert" data-testid="auth-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
