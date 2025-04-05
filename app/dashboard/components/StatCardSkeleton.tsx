'use client';

import { Box, Paper, Skeleton } from '@mui/material';

export default function StatCardSkeleton() {
  return (
    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: 'action.hover',
          borderRadius: 2,
          height: '100%',
        }}
      >
        <Skeleton variant="text" width={80} height={24} />
        <Skeleton variant="text" width={60} height={40} sx={{ mt: 1 }} />
      </Paper>
    </Box>
  );
}
