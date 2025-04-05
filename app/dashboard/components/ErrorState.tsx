'use client';

import { Paper, Typography } from '@mui/material';

interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
      <Typography variant="h6">Error Loading Dashboard</Typography>
      <Typography variant="body1">{message}</Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Try refreshing the page or logging in again.
      </Typography>
    </Paper>
  );
}
