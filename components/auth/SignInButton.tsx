'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

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
      <Button
        disabled
        data-testid="auth-button-placeholder"
        variant="contained"
        sx={{ minWidth: '160px' }}
      >
        <CircularProgress size={20} sx={{ mr: 1, color: 'action.disabled' }} />
        Loading...
      </Button>
    );
  }

  // Show the auth button for normal states
  return (
    <Button
      onClick={handleAuth}
      color={user ? 'error' : 'primary'}
      variant="contained"
      data-testid="auth-button"
      data-loading={isLoading ? 'true' : 'false'}
      disabled={isLoading}
      startIcon={!user && !isLoading ? <GoogleIcon /> : undefined}
      sx={{
        minWidth: '160px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <CircularProgress
          size={20}
          sx={{
            position: 'absolute',
            left: 15,
            color: 'inherit',
          }}
        />
      )}
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
