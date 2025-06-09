'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithLogging, signOutWithLogging } from '@/lib/auth-logging';
import { useTheme } from 'next-themes';
import LoadingAuthButton from './LoadingAuthButton';
import AuthButton from './AuthButton';
import { clientLogger } from '@/lib/client-logger';

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
        await signOutWithLogging({ callbackUrl: '/' });
      } else {
        // If no session, we're signing in
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

        await signInWithLogging('google', {
          callbackUrl: `${currentOrigin}/dashboard`,
          prompt: 'select_account',
        });
      }
    } catch (error) {
      clientLogger.error('Auth action failed', { error });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while NextAuth is determining session status
  if (status === 'loading') {
    return <LoadingAuthButton />;
  }

  // Show the auth button for normal states
  return (
    <AuthButton isLoading={isLoading} isSignedIn={!!session} theme={theme} onClick={handleAuth} />
  );
}
