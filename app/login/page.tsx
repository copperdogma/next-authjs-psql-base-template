'use client';

import SignInButton from '@/components/auth/SignInButton';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { user, isClientSide } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isClientSide && user) {
      router.push('/dashboard');
    }
  }, [user, isClientSide, router]);

  // Show loading state during server-side rendering
  if (!isClientSide) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">Welcome</h1>
        <p className="mb-8 text-xl text-gray-900 dark:text-gray-50">Sign in to access your account</p>
        <Button data-testid="auth-button-placeholder" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  // Don't show login page if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">Welcome</h1>
      <p className="mb-8 text-xl text-gray-900 dark:text-gray-50">Sign in to access your account</p>
      <SignInButton />
    </div>
  );
} 