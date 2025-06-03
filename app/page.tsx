'use client';

import React from 'react';
import { Stack, Typography, Grid, CircularProgress } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CombinedLoginOptions } from '@/components/auth/CombinedLoginOptions';

// Home page will now redirect authenticated users to the dashboard
// and show login options for unauthenticated users

// --- Home Page Component --- // Renamed component
export default function HomePage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Effect to redirect authenticated users to dashboard
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Loading state
  if (status === 'loading' || status === 'authenticated') {
    return (
      <PageLayout title="Home" subtitle="Loading...">
        <Grid container justifyContent="center" alignItems="center" minHeight="50vh">
          <Grid>
            <CircularProgress />
          </Grid>
        </Grid>
      </PageLayout>
    );
  }

  // Unauthenticated state: Show Login Component
  if (status === 'unauthenticated') {
    // We don't use PageLayout here as CombinedLoginOptions provides its own card structure
    return <CombinedLoginOptions />;
  }

  // Fallback - this should not normally be reached
  return (
    <PageLayout title="Home" subtitle="Dashboard">
      <Stack spacing={3}>
        <Typography>Redirecting to dashboard...</Typography>
        <CircularProgress />
      </Stack>
    </PageLayout>
  );
}
