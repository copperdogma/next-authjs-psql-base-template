'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import Link from 'next/link';
import SignInButton from '@/components/auth/SignInButton';

export default function Dashboard() {
  const { user, isClientSide } = useAuth();

  if (!isClientSide) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-4 text-gray-600">Please sign in to view this page</p>
        <div className="mt-6">
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dashboard Cards */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Welcome</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Hello, {user.displayName || user.email || 'User'}! This is your dashboard placeholder.
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Statistics</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your important metrics and data will appear here.
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-semibold">Recent Activity</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your recent actions and activity will be displayed in this section.
          </p>
        </div>
      </div>
      
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/profile" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
} 