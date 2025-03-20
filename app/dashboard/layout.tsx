import { Suspense } from 'react';
import { Metadata } from 'next';

// Dynamic metadata for the dashboard
export async function generateMetadata(): Promise<Metadata> {
  // You could fetch data here to make the metadata dynamic
  // For example, fetching the user's name for a personalized title
  
  return {
    title: 'Dashboard | Next.js Template',
    description: 'View and manage your dashboard data',
    openGraph: {
      title: 'Dashboard | Next.js Template',
      description: 'Access your personalized dashboard and manage your account',
      images: ['/dashboard-og-image.jpg'],
    },
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            {/* Add dashboard header actions here if needed */}
          </div>
        </div>
      </div>
      
      <main>
        <Suspense fallback={<div className="p-6 text-center">Loading dashboard content...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
} 