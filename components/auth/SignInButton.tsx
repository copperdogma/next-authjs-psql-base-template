'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from '@firebase/auth';
import type { Auth } from '@firebase/auth';
import { Button } from '../ui/Button';
import { useAuth } from '../../app/providers/AuthProvider';
import { auth, isFirebaseAuth } from '../../lib/firebase';

type AuthMode = 'sign-in' | 'sign-out';

export default function SignInButton() {
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Unified authentication handler for both sign-in and sign-out
  const handleAuth = useCallback(async (mode: AuthMode) => {
    try {
      setButtonLoading(true);
      
      if (process.env.NODE_ENV === 'test') {
        // Test environment handling
        if (mode === 'sign-in') {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth as Auth, provider);
          const idToken = await result.user.getIdToken();
          
          await createSession(idToken);
          router.push('/dashboard');
        } else {
          await signOut(auth as Auth);
          await deleteSession();
          router.push('/');
        }
      } else {
        // Production environment handling
        if (!isFirebaseAuth(auth)) {
          throw new Error('Firebase Auth not available');
        }
        
        if (mode === 'sign-in') {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();
          
          await createSession(idToken);
          router.push('/dashboard');
        } else {
          await signOut(auth);
          await deleteSession();
          router.push('/');
        }
      }
    } catch (error) {
      console.error(`${mode === 'sign-in' ? 'Sign in' : 'Sign out'} error:`, error);
    } finally {
      setButtonLoading(false);
    }
  }, [router]);

  // Helper functions to handle session API calls
  const createSession = async (idToken: string) => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }
  };

  const deleteSession = async () => {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
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