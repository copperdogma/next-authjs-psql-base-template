'use client';

import React, { useState, useEffect, Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Use dynamic import for components that might not be needed immediately
const SignInButton = React.lazy(() => import('@/components/auth/SignInButton'));

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Next.js Project Template</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Welcome to Your Next.js App</h2>
        <p className="mb-4">
          This is a starter template with Next.js, Firebase Authentication, and PostgreSQL.
        </p>

        <div className="mt-6">
          <ErrorBoundary
            fallback={
              <div className="p-4 border border-orange-300 bg-orange-50 rounded">
                Authentication component failed to load. Please refresh the page.
              </div>
            }
          >
            <Suspense
              fallback={<div className="py-2 px-4 text-center">Loading authentication...</div>}
            >
              <SignInButton />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
