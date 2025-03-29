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

      <div className="mt-8 rounded-lg border border-accent bg-background p-6 shadow-xs">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
