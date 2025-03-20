'use client';

import { useAuth } from '@/app/providers/AuthProvider';

export default function DashboardContent() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <>
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
    </>
  );
} 