'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';

export default function SignInButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      if (session) {
        // If session exists, we're signing out
        await signOut({ callbackUrl: '/' });
      } else {
        // If no session, we're signing in
        await signIn('google', { callbackUrl: '/dashboard' });
      }
    } catch (error) {
      console.error('Auth action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while NextAuth is determining session status
  if (status === 'loading') {
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
      color={session ? 'error' : 'primary'}
      variant="contained"
      data-testid="auth-button"
      data-loading={isLoading ? 'true' : 'false'}
      disabled={isLoading}
      startIcon={!isLoading ? session ? <LogoutIcon /> : <GoogleIcon /> : undefined}
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
        ? session
          ? 'Signing Out...'
          : 'Signing In...'
        : session
          ? 'Sign Out'
          : 'Sign In with Google'}
    </Button>
  );
}
