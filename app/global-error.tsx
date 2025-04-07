'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';

// Log the error as soon as the boundary catches it
let loggedError = false; // Prevent logging multiple times on re-renders

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error immediately on the client, sending it to the server
  if (!loggedError) {
    clientLogger.error('GlobalErrorBoundary caught an error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest,
      },
      location: 'app/global-error.tsx',
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
          <h2 className="text-3xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            A critical error occurred in the application. Please try again.
            {/* Avoid showing error.message directly in the global boundary for security */}
          </p>
          <button
            onClick={() => reset()} // Attempt to recover by re-rendering the root route
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
          >
            Try again
          </button>
          {/* Optionally add a link to a status page or support */}
        </div>
      </body>
    </html>
  );
}
