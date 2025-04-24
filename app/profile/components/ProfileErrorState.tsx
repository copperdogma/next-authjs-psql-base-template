'use client';

import { Paper, Typography } from '@mui/material';

export default function ProfileErrorState() {
  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
      <Typography variant="h6">Error Loading Profile</Typography>
      <Typography variant="body1">Session not authenticated. Please log in again.</Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Try refreshing the page or logging in again.
      </Typography>
    </Paper>
  );
}
