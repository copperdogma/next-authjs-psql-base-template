'use client';

export default function DashboardSkeleton() {
  return (
    <div
      className="rounded-lg border border-accent bg-background p-6 shadow-xs animate-pulse"
      data-testid="dashboard-skeleton"
    >
      <div className="mb-4 h-6 w-1/3 rounded bg-accent"></div>
      <div className="mb-2 h-4 w-2/3 rounded bg-accent"></div>
      <div className="mb-6 h-4 w-1/2 rounded bg-accent"></div>

      <div className="mb-4 h-6 w-1/3 rounded bg-accent"></div>
      <div className="h-4 w-2/3 rounded bg-accent"></div>
    </div>
  );
}
