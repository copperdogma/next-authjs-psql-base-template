'use client';

import { useState, useEffect } from 'react';
import SignInButton from '@/components/auth/SignInButton';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_TITLE}}'}
        </h1>
        <p className="mt-4 text-xl text-gray-900 dark:text-gray-50">
          {process.env.NEXT_PUBLIC_APP_DESCRIPTION || '{{YOUR_PROJECT_DESCRIPTION}}'}
        </p>
        <div className="mt-8">
          {isMounted ? (
            <SignInButton />
          ) : (
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-700 text-white h-10 px-4 py-2">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
