'use client';

import { Box, Paper, Skeleton } from '@mui/material';
import StatCardSkeleton from './StatCardSkeleton';

export default function OverviewSectionSkeleton() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Skeleton variant="text" width={150} height={32} sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </Box>
    </Paper>
  );
}
