'use client';

import { useSession } from 'next-auth/react';
import { Box, Paper, Typography, Stack, CircularProgress } from '@mui/material';
import React, { useEffect, useState } from 'react';

export default function DashboardContent(): React.ReactNode {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Add useEffect to log session status for debugging
  useEffect(() => {
    // Only log in development/test environments
    if (process.env.NODE_ENV !== 'production') {
      if (status === 'loading') {
        console.log('DashboardContent: Session loading...');
      } else if (status === 'authenticated') {
        console.log('DashboardContent: Session authenticated', session);
      } else if (status === 'unauthenticated') {
        console.log('DashboardContent: Session unauthenticated');
      }
    }

    if (status === 'unauthenticated') {
      setError('Session not authenticated. Please log in again.');
    }
  }, [status, session]);

  // Loading state
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="h6">Error Loading Dashboard</Typography>
        <Typography variant="body1">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Try refreshing the page or logging in again.
        </Typography>
      </Paper>
    );
  }

  // No session state
  if (!session?.user) {
    return (
      <Paper elevation={2} sx={{ p: 3, bgcolor: 'warning.light' }}>
        <Typography variant="h6">Session Not Available</Typography>
        <Typography variant="body1">
          Unable to load your user information. Please try logging in again.
        </Typography>
      </Paper>
    );
  }

  const user = session.user;

  return (
    <Stack spacing={4}>
      {/* Overview Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Overview
        </Typography>
        <Typography variant="body1">Welcome back, {user.name || user.email}!</Typography>
      </Paper>

      {/* Activity Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recent activity to show.
        </Typography>
      </Paper>

      {/* Quick Actions Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, flex: 1 }}>
            <Typography variant="body1">Create New Item</Typography>
          </Box>
          <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, flex: 1 }}>
            <Typography variant="body1">View Reports</Typography>
          </Box>
          <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, flex: 1 }}>
            <Typography variant="body1">Profile Settings</Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
