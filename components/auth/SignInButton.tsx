'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from '@firebase/auth';
import type { Auth } from '@firebase/auth';
import { Button } from '../ui/Button';
import { useAuth } from '../../app/providers/AuthProvider';
import { auth, isFirebaseAuth } from '../../lib/firebase';

type AuthMode = 'sign-in' | 'sign-out';

export default function SignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buttonLoading, setButtonLoading] = useState(false);
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const handleAuth = useCallback(async (mode: AuthMode) => {
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
      console.error(`${mode === 'sign-in' ? 'Sign in' : 'Sign out'} error:`, error);
    } finally {
      setButtonLoading(false);
    }
  }, [getCallbackUrl]);

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
        throw new Error(`Failed to create session: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  };

  const deleteSession = async () => {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
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

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        disabled={buttonLoading}
        data-testid="auth-button"
        data-auth-state="sign-out"
        data-loading={buttonLoading.toString()}
      >
        {buttonLoading ? 'Signing out...' : 'Sign Out'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={buttonLoading}
      data-testid="auth-button"
      data-auth-state="sign-in"
      data-loading={buttonLoading.toString()}
    >
      {buttonLoading ? 'Signing in...' : 'Sign In with Google'}
    </Button>
  );
} 