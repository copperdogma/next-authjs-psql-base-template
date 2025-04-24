'use client';

import { signIn, useSession, getCsrfToken } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Google as GoogleIcon } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import { Box, Card, CardContent, CardHeader, Container, Typography, Stack } from '@mui/material';

export default function Login() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const [csrfToken, setCsrfToken] = useState('');

  // If already authenticated, redirect to home
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token || '');
    };
    fetchToken();
  }, []);

  const handleSignIn = (provider: string) => {
    signIn(provider, { 
      callbackUrl,
      prompt: 'select_account' // Force account selection every time
    });
  };

  // Show loading state while session status is resolving
  if (status === 'loading') {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  // Determine if we are in the test environment to show the E2E form
  const isTestEnvironment = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true';

  return (
    <Container component="main" maxWidth="xs">
      <Card sx={{ width: '100%', p: 2 }}>
        <CardHeader
          title={
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Welcome
            </Typography>
          }
          subheader={
            <Typography variant="body1" align="center" color="text.secondary">
              Sign in to access your account
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Button
              onClick={() => handleSignIn('google')}
              variant="contained"
              startIcon={<GoogleIcon />}
              data-testid="google-signin-button"
              fullWidth
            >
              Sign in with Google
            </Button>

            {/* Conditionally render E2E Credentials Form */} 
            {isTestEnvironment && (
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
                  {/* Ensure redirect to dashboard after credentials sign-in */}
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <input
                    name="email" // Name must match credentials config
                    type="email"
                    placeholder="Test Email"
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} // Basic styling
                  />
                  <input
                    name="password" // Name must match credentials config
                    type="password"
                    placeholder="Test Password"
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} // Basic styling
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
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
