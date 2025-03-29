'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export default function SignInButton() {
  const { signIn, signOut, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      if (user) {
        // If user exists, we're signing out
        setIsSigningIn(false);
        await signOut();
      } else {
        // If no user, we're signing in
        setIsSigningIn(true);
        await signIn();
      }
    } catch (error) {
      // Error handling is done in AuthProvider
      console.error('Auth action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [signIn, signOut, user]);

  // Show loading state when not mounted or while auth is loading
  if (!isMounted || loading) {
    return (
      <Button disabled data-testid="auth-button-placeholder" size="default">
        Loading...
      </Button>
    );
  }

  // Generate Google button style based on user state
  const googleButtonStyles = !user
    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700'
    : '';

  // Show the auth button for normal states
  return (
    <Button
      onClick={handleAuth}
      variant={user ? 'destructive' : 'default'}
      size="default"
      data-testid="auth-button"
      data-loading={isLoading ? 'true' : 'false'}
      disabled={isLoading}
      className={cn('font-medium shadow-sm', googleButtonStyles)}
    >
      {isLoading
        ? isSigningIn
          ? 'Signing In...'
          : 'Signing Out...'
        : user
          ? 'Sign Out'
          : 'Sign In with Google'}
    </Button>
  );
}
