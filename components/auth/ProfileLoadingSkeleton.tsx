'use client';

import { Box, Skeleton } from '@mui/material';

export default function ProfileLoadingSkeleton() {
  return (
    <Box data-testid="profile-loading" sx={{ display: 'inline-flex', mx: 1 }}>
      <Skeleton variant="circular" width={36} height={36} />
    </Box>
  );
}
