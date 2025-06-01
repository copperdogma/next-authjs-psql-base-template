'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Typography, Paper, Container, Box, Button } from '@mui/material';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Signin: 'There was an error signing in. Please try again with a different account or method.',
    OAuthSignin: 'There was an error signing in with the OAuth provider. Please try again.',
    OAuthCallback: 'There was an error during the OAuth callback. Please try again.',
    OAuthCreateAccount: 'Could not create user account using OAuth. Please try a different method.',
    EmailCreateAccount: 'Could not create user account with email. Please try again.',
    Callback: 'An error occurred during the callback process. Please try again.',
    OAuthAccountNotLinked:
      'This account is not linked. To confirm your identity, please sign in with the same account you used originally.',
    EmailSignin: 'The sign-in email could not be sent. Please try again.',
    CredentialsSignin: 'Sign in failed. Please check your email and password and try again.',
    SessionRequired: 'You need to be signed in to access this page. Please sign in.',
    Default: 'An unexpected authentication error occurred. Please try again.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          color="error.main"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Authentication Error
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          {message}
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Button component={Link} href="/login" variant="contained" fullWidth>
            Go to Login Page
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
