'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';
import { logger } from '@/lib/logger';

// Extracted handler logic
async function performCredentialsLogin(
  email: string,
  password: string,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
) {
  setError(null);
  setLoading(true);
  logger.debug('[Credentials Login Handler] Attempting login', { email });

  try {
    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually or based on response
      email: email,
      password: password,
    });

    if (result?.error) {
      logger.warn('[Credentials Login Handler] Failed', { email, error: result.error });
      // Map common errors to user-friendly messages
      if (result.error === 'CredentialsSignin') {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } else if (result?.ok) {
      logger.info('[Credentials Login Handler] Success', { email });
      // Successful login - parent component should react to session change.
      // No redirect needed here, session update will trigger page change if necessary.
    } else {
      // Handle cases where result is null or ok is false without an error message
      setError('Login failed. Please check your credentials.');
    }
  } catch (err) {
    logger.error('[Credentials Login Handler] Exception', { email, error: err });
    setError('A system error occurred during login.');
  } finally {
    setLoading(false);
  }
}

/**
 * Component for handling user login via credentials (email/password).
 */
const CredentialsLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Call the extracted handler function
    performCredentialsLogin(email, password, setError, setLoading);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit} // Use the simplified handleSubmit
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }} // Add margin top
    >
      <Typography variant="h6" component="h3" gutterBottom>
        Sign in with Email
      </Typography>
      <TextField
        id="email" // Add id for label association
        label="Email"
        type="email"
        variant="outlined"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <TextField
        id="password" // Add id for label association
        label="Password"
        type="password"
        variant="outlined"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
          {error}
        </Alert>
      )}
      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In with Email'}
      </Button>
    </Box>
  );
};

export default CredentialsLoginForm;
