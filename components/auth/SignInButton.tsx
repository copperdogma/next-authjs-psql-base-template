'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { Button } from '../ui/Button';

export default function SignInButton() {
  const { signIn, signOut, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      if (user) {
        await signOut();
      } else {
        await signIn();
      }
    } catch {
      // Error handling is done in AuthProvider
    } finally {
      setIsLoading(false);
    }
  }, [signIn, signOut, user]);

  // Show loading state when not mounted or while auth is loading
  if (!isMounted || loading) {
    return (
      <Button 
        disabled 
        data-testid="auth-button-placeholder"
      >
        Loading...
      </Button>
    );
  }

  // Show the auth button for normal states
  return (
    <Button 
      onClick={handleAuth} 
      variant={user ? 'destructive' : 'default'}
      data-testid="auth-button"
      data-loading={isLoading ? 'true' : 'false'}
      disabled={isLoading}
    >
      {isLoading 
        ? (user ? 'Signing Out...' : 'Signing In...') 
        : (user ? 'Sign Out' : 'Sign In with Google')}
    </Button>
  );
}
