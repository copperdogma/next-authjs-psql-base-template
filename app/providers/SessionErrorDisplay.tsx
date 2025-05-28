'use client';

/**
 * SessionErrorDisplay Component
 *
 * This component renders a user-friendly error message when session-related errors occur.
 * It works in conjunction with SessionErrorHandler which captures and manages these errors.
 *
 * Features:
 * - Provides a visual indication of session/authentication errors
 * - Shows appropriate error messages based on environment (generic in production, detailed in development)
 * - Styled to be noticeable but not intrusive
 *
 * Usage:
 * This component is conditionally rendered when a session error occurs. It should be used
 * alongside SessionErrorHandler and is typically integrated in the SessionProviderWrapper.
 *
 * @example
 * // In SessionProviderWrapper.tsx
 * const [sessionError, setSessionError] = useState<Error | null>(null);
 *
 * return (
 *   <SessionProvider session={session}>
 *     <SessionErrorHandler
 *       sessionError={sessionError}
 *       setSessionError={setSessionError}
 *     />
 *     {sessionError && <SessionErrorDisplay error={sessionError} />}
 *     {children}
 *   </SessionProvider>
 * );
 */

import { getDisplayErrorMessage } from '@/lib/utils/error-display';

interface SessionErrorDisplayProps {
  error: Error;
}

export default function SessionErrorDisplay({ error }: SessionErrorDisplayProps) {
  const displayMessage = getDisplayErrorMessage(error, 'A session error occurred.');

  return (
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
        <small>{displayMessage}</small>
      </p>
    </div>
  );
}
