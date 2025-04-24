'use client';

import { useState, useEffect } from 'react';
import { getCsrfToken } from 'next-auth/react';
import { Box, Button, Typography, Stack, TextField } from '@mui/material';

interface E2ETestLoginFormProps {
  callbackUrl: string;
}

export default function E2ETestLoginForm({ callbackUrl }: E2ETestLoginFormProps) {
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token || '');
    };
    fetchToken();
  }, []);

  return (
    <Box
      component="form"
      method="post"
      action="/api/auth/callback/credentials"
      sx={{ width: '100%', mt: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}
    >
      <Typography variant="overline" display="block" gutterBottom align="center">
        E2E Test Login (Test Env Only)
      </Typography>
      <Stack spacing={2}>
        {csrfToken && <input type="hidden" name="csrfToken" value={csrfToken} />}
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <TextField
          name="email" // Name must match credentials config
          type="email"
          placeholder="Test Email"
          label="Test Email"
          required
          fullWidth
          size="small"
          variant="outlined"
          inputProps={{ 'data-testid': 'e2e-email-input' }} // Add test ID
        />
        <TextField
          name="password" // Name must match credentials config
          type="password"
          placeholder="Test Password"
          label="Test Password"
          required
          fullWidth
          size="small"
          variant="outlined"
          inputProps={{ 'data-testid': 'e2e-password-input' }} // Add test ID
        />
        <Button
          type="submit"
          variant="outlined"
          data-testid="e2e-signin-button" // Add a test ID
          fullWidth
        >
          Sign in with E2E Test Login
        </Button>
      </Stack>
    </Box>
  );
}
