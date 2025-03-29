'use client';

import { useAuth } from '@/app/providers/AuthProvider';

export default function DashboardContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Example of container query usage - new in Tailwind CSS v4 */}
      <div className="@container mb-6">
        <div className="rounded-lg border border-accent bg-background p-6 shadow-xs">
          <h2 className="mb-4 text-xl font-semibold">Overview</h2>

          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-4">
            <div className="rounded-lg bg-accent p-4">
              <h3 className="text-lg font-medium">Metric 1</h3>
              <p className="text-2xl font-bold">3,721</p>
            </div>
            <div className="rounded-lg bg-accent p-4">
              <h3 className="text-lg font-medium">Metric 2</h3>
              <p className="text-2xl font-bold">2,519</p>
            </div>
            <div className="rounded-lg bg-accent p-4 @md:col-span-2 @xl:col-span-1">
              <h3 className="text-lg font-medium">Metric 3</h3>
              <p className="text-2xl font-bold">1,489</p>
            </div>
            <div className="rounded-lg bg-accent p-4 @xl:col-span-1">
              <h3 className="text-lg font-medium">Metric 4</h3>
              <p className="text-2xl font-bold">968</p>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">Using @container, @md, and @xl breakpoints.</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-accent bg-background p-6 shadow-xs">
          <h2 className="mb-2 text-xl font-semibold">Welcome</h2>
          <p className="text-muted-foreground">
            Hello, {user.displayName || user.email || 'User'}! This is your dashboard placeholder.
          </p>
        </div>
        <div className="rounded-lg border border-accent bg-background p-6 shadow-xs">
          <h2 className="mb-2 text-xl font-semibold">Statistics</h2>
          <p className="text-muted-foreground">Your important metrics and data will appear here.</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-accent bg-background p-6 shadow-xs">
        <h2 className="mb-2 text-xl font-semibold">Recent Activity</h2>
        <p className="text-muted-foreground">
          Your recent actions and activity will be displayed in this section.
        </p>
      </div>
    </>
  );
}
