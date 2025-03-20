'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GoogleAuthProvider } from '@firebase/auth';
import { signInWithPopup } from '@firebase/auth';
import { signOut } from '@firebase/auth';
import type { Auth } from '@firebase/auth';
import { Button } from '../ui/Button';
import { useAuth } from '../../app/providers/AuthProvider';
import { auth } from '../../lib/firebase';

export default function SignInButton() {
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async () => {
    try {
      setButtonLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth as Auth, provider);
      const idToken = await result.user.getIdToken();

      // Create session
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

      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setButtonLoading(true);
      await signOut(auth as Auth);
      
      // Delete session
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setButtonLoading(false);
    }
  };

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
        data-loading={buttonLoading}
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
      data-loading={buttonLoading}
    >
      {buttonLoading ? 'Signing in...' : 'Sign In with Google'}
    </Button>
  );
} 