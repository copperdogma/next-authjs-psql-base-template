'use client';

import { Paper, Skeleton } from '@mui/material';

export default function ActivitySectionSkeleton() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="95%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="85%" />
    </Paper>
  );
}
