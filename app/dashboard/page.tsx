import { Suspense } from 'react';
import Link from 'next/link';

// Import client components
import DashboardContent from '@/app/dashboard/components/DashboardContent';
import DashboardSkeleton from '@/app/dashboard/components/DashboardSkeleton';

// This is a server component - authentication is handled by middleware
export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/profile"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
