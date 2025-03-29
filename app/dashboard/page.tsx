import { Suspense } from 'react';
import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';

// Import client components
import DashboardContent from '@/app/dashboard/components/DashboardContent';
import DashboardSkeleton from '@/app/dashboard/components/DashboardSkeleton';

// This is a server component - authentication is handled by middleware
export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button component={Link} href="/profile" variant="contained" color="primary">
            View Profile
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
