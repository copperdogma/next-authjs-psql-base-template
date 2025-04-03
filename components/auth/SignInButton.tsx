'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useTheme } from 'next-themes';

/**
 * SignInButton component that handles authentication while preserving theme
 *
 * This component:
 * 1. Displays a sign-in or sign-out button based on authentication state
 * 2. Handles the authentication flow with loading states
 * 3. Uses next-themes features for consistent theming during navigation
 *
 * @returns {JSX.Element} Sign-in/sign-out button with appropriate state and loading indicators
 */
export default function SignInButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleAuth = async () => {
    try {
      setIsLoading(true);

      if (session) {
        // If session exists, we're signing out
        // The callbackUrl ensures theme is preserved through the redirect
        await signOut({ callbackUrl: '/' });
      } else {
        // If no session, we're signing in
        // Explicitly use the current origin for the callback URL to handle port changes
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth debug: Signing in with origin:', currentOrigin);
        }

        await signIn('google', {
          // Use explicit full URL for callbackUrl to handle port changes
          callbackUrl: `${currentOrigin}/dashboard`,
        });
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
      data-theme={theme} // Add theme data attribute for testing
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
