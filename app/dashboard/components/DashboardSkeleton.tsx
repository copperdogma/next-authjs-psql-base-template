'use client';

import { Stack } from '@mui/material';
import OverviewSectionSkeleton from './OverviewSectionSkeleton';
import DashboardCardsSkeleton from './DashboardCardsSkeleton';
import ActivitySectionSkeleton from './ActivitySectionSkeleton';

export default function DashboardSkeleton() {
  return (
    <Stack spacing={4}>
      <OverviewSectionSkeleton />
      <DashboardCardsSkeleton />
      <ActivitySectionSkeleton />
    </Stack>
  );
}
