import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Next.js Template',
  description: 'Manage your user profile',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Your Profile</h1>
          </div>
        </div>
      </div>
      
      <main>
        <Suspense fallback={<div className="p-6 text-center">Loading profile content...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
} 