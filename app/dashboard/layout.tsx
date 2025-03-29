import { Suspense } from 'react';
import { Metadata } from 'next';
import { Container } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout title="Dashboard">
      <Suspense
        fallback={
          <Container sx={{ py: 6, textAlign: 'center' }}>Loading dashboard content...</Container>
        }
      >
        {children}
      </Suspense>
    </PageLayout>
  );
}
