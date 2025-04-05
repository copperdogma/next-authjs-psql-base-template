'use client';

import { Paper, Typography, Stack, Box } from '@mui/material';
import { Session } from 'next-auth';

interface DashboardSectionsProps {
  session: Session;
}

export default function DashboardSections({ session }: DashboardSectionsProps) {
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
