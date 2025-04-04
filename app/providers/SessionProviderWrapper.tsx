'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loggers } from '@/lib/logger'; // Assuming logger setup

const logger = loggers.auth;

// Recovery timeout in milliseconds
const SESSION_RECOVERY_DELAY_MS = 3000;

// Internal component to handle session logic
function SessionLogic() {
  const { data: session, status } = useSession();

  useEffect(() => {
    logger.debug('Session status changed', { status, session });

    if (status === 'authenticated' && session?.user) {
      logger.info('User authenticated', { userId: session.user.id, email: session.user.email });
      // Additional logic for authenticated users (e.g., analytics)
    } else if (status === 'unauthenticated') {
      logger.info('User unauthenticated');
      // Additional logic for unauthenticated users
    }
    // Explicitly return undefined to satisfy TS7030
    return undefined;
  }, [session, status]);

  // Return null as this component doesn't render anything itself
  return null;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const router = useRouter();

  // Add error handler for session initialization failures
  useEffect(() => {
    const handleSessionError = (error: Event) => {
      // Only handle session-related errors
      if (
        error instanceof ErrorEvent &&
        (error.message?.includes('session') || error.message?.includes('auth'))
      ) {
        console.error('Session initialization error:', error);
        setSessionError(error instanceof Error ? error : new Error('Unknown session error'));
      }
    };

    // Listen for session-related errors
    window.addEventListener('error', handleSessionError);

    // The unhandledrejection handler looks good as it already checks for session/auth keywords
    window.addEventListener('unhandledrejection', event => {
      if (event.reason?.message?.includes('session') || event.reason?.message?.includes('auth')) {
        console.error('Unhandled session promise rejection:', event.reason);
        setSessionError(event.reason);
      }
    });

    return () => {
      window.removeEventListener('error', handleSessionError);
      window.removeEventListener('unhandledrejection', handleSessionError);
    };
  }, []);

  // Handle session recovery if there's an error
  useEffect(() => {
    if (sessionError) {
      console.error('Attempting to recover from session error');
      const timer = setTimeout(() => {
        // Try to refresh the page after a delay
        router.refresh();
      }, SESSION_RECOVERY_DELAY_MS);
      return () => clearTimeout(timer);
    }
    // Explicitly return undefined when no sessionError
    return undefined;
  }, [sessionError, router]);

  return (
    <SessionProvider>
      <SessionLogic />
      {sessionError ? (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            backgroundColor: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '4px',
          }}
        >
          <h2>Session Error</h2>
          <p>There was a problem loading your session. Trying to recover...</p>
          <p>
            <small>{sessionError.message}</small>
          </p>
        </div>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
