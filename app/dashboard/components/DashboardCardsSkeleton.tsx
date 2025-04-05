'use client';

import { Box } from '@mui/material';
import DashboardCardSkeleton from './DashboardCardSkeleton';

export default function DashboardCardsSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
    </Box>
  );
}
