'use client';

import { useSession, signIn } from 'next-auth/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Google as GoogleIcon } from '@mui/icons-material';
import AuthFallback from './AuthFallback';

export default function AuthButtons() {
  const { data } = useSession();

  // Handle sign in with Google
  const handleSignIn = () => {
    signIn('google', { 
      callbackUrl: '/dashboard', 
      prompt: 'select_account' // Force account selection every time
    });
  };

  if (data) {
    return (
      <Box sx={{ mt: 3 }}>
        <Button component={Link} href="/dashboard" variant="contained" size="large" sx={{ mr: 2 }}>
          Dashboard
        </Button>
        <Button component={Link} href="/profile" variant="outlined" size="large">
          Profile
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <ErrorBoundary fallback={<AuthFallback />}>
        <Button onClick={handleSignIn} variant="contained" size="large" startIcon={<GoogleIcon />}>
          Sign in with Google
        </Button>
      </ErrorBoundary>
    </Box>
  );
}
