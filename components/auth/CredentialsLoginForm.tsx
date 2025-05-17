'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';

// --- Material UI Imports ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// Interface for the props of the extracted form UI component
interface CredentialsFormUIProps {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  handleEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

// Extracted UI component for the form elements
// eslint-disable-next-line max-lines-per-function -- UI component length is due to necessary MUI props and structure for form elements; further breakdown would be excessive.
function CredentialsFormUI({
  email,
  password,
  isLoading,
  error,
  handleEmailChange,
  handlePasswordChange,
  handleSubmit,
}: CredentialsFormUIProps) {
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ mt: 1 }}
      data-testid="credentials-form"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} suppressHydrationWarning>
        <TextField
          margin="none"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={handleEmailChange}
          disabled={isLoading}
          size="small"
          error={!!error}
          suppressHydrationWarning
          aria-label="Email Address"
        />
        <TextField
          margin="none"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          size="small"
          error={!!error}
          suppressHydrationWarning
          aria-label="Password"
        />
        {error && (
          <Typography
            color="error"
            variant="body2"
            sx={{ mt: 1, textAlign: 'center' }}
            role="alert"
          >
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading || !email || !password}
          sx={{ mt: 1, mb: 1 }}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          aria-disabled={isLoading || !email || !password}
        >
          {isLoading ? 'Signing In...' : 'Sign In with Email'}
        </Button>
      </Box>
    </Box>
  );
}

interface CredentialsLoginFormProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Helper function to determine the error message based on signIn result
function _getSignInErrorMessage(error: string | undefined | null): string {
  if (error === 'CredentialsSignin') {
    return 'Invalid email or password.';
  }
  // Could add more specific error checks here if needed
  return 'Login failed. Please check your details or try another method.';
}

export function CredentialsLoginForm({
  isLoading,
  setIsLoading,
  error,
  setError,
}: CredentialsLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // eslint-disable-next-line max-statements -- Statement count is slightly high due to essential error handling/branching for signIn result; further extraction would obscure the flow.
  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      logger.info('Attempting credentials sign-in...');
      const callbackUrl = searchParams.get('callbackUrl');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.ok) {
        const redirectUrl = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
        logger.info(`Credentials sign-in successful, redirecting to ${redirectUrl}`);
        router.push(redirectUrl);
      } else {
        const errorMessage = _getSignInErrorMessage(result?.error);
        logger.warn('Credentials sign-in failed:', { error: result?.error });
        setError(errorMessage);
        setIsLoading(false);
      }
    } catch (err) {
      logger.error('Unknown exception during credentials sign-in:', { error: err });
      // For thrown errors, always use the generic user-friendly message
      setError('An unexpected error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  // Render the extracted UI component, passing down state and handlers
  return (
    <CredentialsFormUI
      email={email}
      password={password}
      isLoading={isLoading}
      error={error}
      handleEmailChange={e => setEmail(e.target.value)}
      handlePasswordChange={e => setPassword(e.target.value)}
      handleSubmit={handleCredentialsSubmit}
    />
  );
}
