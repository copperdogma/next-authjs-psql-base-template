'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { clientLogger } from '@/lib/client-logger';

// Log the error as soon as the boundary catches it
let loggedError = false; // Prevent logging multiple times on re-renders

interface ErrorComponentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ErrorBoundary function - Removed the disable comment entirely
const ErrorBoundary = ({ error, reset }: ErrorComponentProps) => {
  // Log the error immediately on the client, sending it to the server
  if (!loggedError) {
    clientLogger.error('ErrorBoundary caught an error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest, // Next.js specific digest for server errors
      },
      location: 'app/error.tsx',
    });
    loggedError = true;
  }

  // Reset loggedError flag if component remounts (e.g., after reset)
  useEffect(() => {
    loggedError = false; // Reset on mount
    return () => {
      loggedError = false; // Reset on unmount
    };
  }, []);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Something went wrong!</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            {error.message || 'An unexpected error occurred. We apologize for the inconvenience.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => reset()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              Try again
            </button>
            <Link
              href="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded"
            >
              Return to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
};

export default ErrorBoundary;
