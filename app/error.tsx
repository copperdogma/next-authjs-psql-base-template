'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

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
}
