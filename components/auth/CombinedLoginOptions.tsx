'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { FcGoogle } from 'react-icons/fc';

// --- Local Component Imports ---
import { CredentialsLoginForm } from './CredentialsLoginForm'; // Import the new form

// --- Material UI Imports ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';

// Simple Google Sign-in Button component
interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled: boolean;
}

function GoogleSignInButton({ onClick, disabled }: GoogleSignInButtonProps) {
  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={onClick}
      startIcon={<FcGoogle />}
      disabled={disabled}
      data-testid="google-signin-button" // Add test id
    >
      Sign in with Google
    </Button>
  );
}

// eslint-disable-next-line max-lines-per-function -- Component structure including state, handler, and rendering is clear at this length; further extraction would complicate prop drilling.
export function CombinedLoginOptions() {
  // Keep shared state here if needed across different login methods
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    logger.info('Initiating Google Sign-In from CombinedLoginOptions...');
    setIsLoading(true); // Set loading state for both buttons
    setError(null); // Clear previous errors

    // Make the signIn call safely - handle both Promise and non-Promise returns
    const signInResult = signIn('google', { callbackUrl: '/dashboard' });

    // Handle Promise return (newer versions of next-auth)
    if (signInResult && typeof signInResult.catch === 'function') {
      signInResult.catch(error => {
        logger.error('Google Sign-In failed:', { error });
        setError('Google sign-in failed. Please try again.');
        setIsLoading(false);
      });
    }
    // Note: setIsLoading(false) is handled within the catch block for Google
    // or implicitly on successful navigation by NextAuth
  };

  // Credentials form logic is now encapsulated in CredentialsLoginForm
  // We pass down the shared state setters

  return (
    <Card
      sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2 }}
      role="region"
      aria-labelledby="login-header"
    >
      {/* Use a proper h1 element for the page heading */}
      <Typography
        variant="h4"
        component="h1"
        id="login-header"
        sx={{
          textAlign: 'center',
          mb: 2,
          fontWeight: 'bold',
          fontSize: { xs: '1.5rem', sm: '2rem' },
          visibility: 'visible', // Ensure visibility
          display: 'block',
        }}
      >
        Welcome to the App
      </Typography>

      <CardHeader
        title="Sign In"
        subheader="Access your account"
        titleTypographyProps={{
          align: 'center',
          variant: 'h5',
          component: 'h2', // Use h2 for the card heading
          id: 'signin-title',
        }}
        subheaderTypographyProps={{ align: 'center', variant: 'body2' }}
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Google Button */}
          <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />

          {/* MUI Divider with Text */}
          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" sx={{ px: 1, color: 'text.secondary' }}>
              Or continue with
            </Typography>
          </Divider>

          {/* Credentials Form Component */}
          <CredentialsLoginForm
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
          />

          {/* Sign Up Link - Moved inside the Stack */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink component={Link} href="/register" variant="body2" underline="always">
                Sign Up
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
