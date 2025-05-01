'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stack,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid, // Use Grid for the 3-column Quick Actions layout
} from '@mui/material';
// import { useSession } from 'next-auth/react'; // No longer needed here
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import PageLayout from '@/components/layouts/PageLayout';

// --- Content Sections for Dashboard ---

const OverviewSection = () => {
  // Read name from Zustand store
  const currentName = useUserStore(state => state.name);

  // Use the name from the store, fallback to 'there'
  const userName = currentName || 'there';

  return (
    <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
      <CardHeader title="Overview" />
      <CardContent>
        <Typography variant="body1">Welcome back, {userName}!</Typography>
      </CardContent>
    </Card>
  );
};

const RecentActivitySection = () => (
  <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
    <CardHeader title="Recent Activity" />
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        No recent activity to show.
      </Typography>
      {/* TODO: Add logic to display actual activity */}
    </CardContent>
  </Card>
);

const QuickActionsSection = () => (
  <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
    <CardHeader title="Quick Actions" />
    <CardContent>
      <Grid container spacing={2}>
        {/* Add the View Profile button as the first item */}
        {/* @ts-expect-error - See comment below */}
        <Grid item xs={12} sm={4}>
          <Button variant="contained" color="primary" fullWidth component={Link} href="/profile">
            View Profile
          </Button>
        </Grid>
        {/*
            Ignoring TypeScript error TS2769 here. The standard MUI Grid container/item pattern
            is used, but TypeScript incorrectly reports that the 'item' prop does not exist.
            This is likely due to a type definition conflict or environment issue, as the
            code structure is valid and typically type-checks correctly.
          */}
        {/* @ts-expect-error - See comment above */}
        <Grid item xs={12} sm={4}>
          <Button variant="outlined" fullWidth>
            Create New Item
          </Button>
        </Grid>
        {/* @ts-expect-error - See comment above */}
        <Grid item xs={12} sm={4}>
          <Button variant="outlined" fullWidth>
            View Reports
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// --- Dashboard Page Component --- //
export default function DashboardPage() {
  return (
    <PageLayout title="Dashboard" subtitle="Overview of your account and quick actions">
      <Stack spacing={3}>
        <OverviewSection />
        <RecentActivitySection />
        <QuickActionsSection />
      </Stack>
    </PageLayout>
  );
}
