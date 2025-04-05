'use client';

import { Box, Paper, Skeleton } from '@mui/material';

export default function DashboardCardSkeleton() {
  return (
    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          height: '100%',
          borderRadius: 2,
        }}
      >
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
      </Paper>
    </Box>
  );
}
