'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Google as GoogleIcon } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

export default function Login() {
  const router = useRouter();
  const { data, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  // If already authenticated, redirect to home
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  // Show loading state while session status is resolving
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="mb-8 text-4xl font-bold text-foreground">Welcome</h1>
        <p className="mb-8 text-xl text-foreground">Sign in to access your account</p>
        <CircularProgress />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold text-foreground">Welcome</h1>
      <p className="mb-8 text-xl text-foreground">Sign in to access your account</p>
      <Button
        onClick={() => handleSignIn('google')}
        variant="contained"
        startIcon={<GoogleIcon />}
        data-testid="google-signin-button"
      >
        Sign in with Google
      </Button>
    </div>
  );
}
