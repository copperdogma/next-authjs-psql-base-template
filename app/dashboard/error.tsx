'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => reset()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try again
        </button>
        <Link href="/" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
          Return to home
        </Link>
      </div>
    </div>
  );
}
