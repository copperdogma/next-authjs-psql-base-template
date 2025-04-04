'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Recovery timeout in milliseconds
const SESSION_RECOVERY_DELAY_MS = 3000;

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
  }, [sessionError, router]);

  return (
    <SessionProvider>
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
