'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/client-logger';

// Recovery timeout in milliseconds
const SESSION_RECOVERY_DELAY_MS = 3000;

interface SessionErrorHandlerProps {
  sessionError: Error | null;
  setSessionError: (error: Error | null) => void;
}

export default function SessionErrorHandler({
  sessionError,
  setSessionError,
}: SessionErrorHandlerProps) {
  const router = useRouter();

  // Add error handler for session initialization failures
  useEffect(() => {
    const handleSessionError = (error: Event) => {
      // Only handle session-related errors
      if (
        error instanceof ErrorEvent &&
        (error.message?.includes('session') || error.message?.includes('auth'))
      ) {
        clientLogger.error('Session initialization error', { error });
        setSessionError(error instanceof Error ? error : new Error('Unknown session error'));
      }
    };

    // Listen for session-related errors
    window.addEventListener('error', handleSessionError);

    // The unhandledrejection handler looks good as it already checks for session/auth keywords
    window.addEventListener('unhandledrejection', event => {
      if (event.reason?.message?.includes('session') || event.reason?.message?.includes('auth')) {
        clientLogger.error('Unhandled session promise rejection', { reason: event.reason });
        setSessionError(event.reason);
      }
    });

    return () => {
      window.removeEventListener('error', handleSessionError);
      window.removeEventListener('unhandledrejection', handleSessionError);
    };
  }, [setSessionError]);

  // Handle session recovery if there's an error
  useEffect(() => {
    if (sessionError) {
      clientLogger.error('Attempting to recover from session error');
      const timer = setTimeout(() => {
        // Try to refresh the page after a delay
        router.refresh();
      }, SESSION_RECOVERY_DELAY_MS);
      return () => clearTimeout(timer);
    }
    // Explicitly return undefined when no sessionError
    return undefined;
  }, [sessionError, router]);

  return null;
}
