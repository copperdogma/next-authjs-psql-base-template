'use client';

import { Paper, Typography } from '@mui/material';

export default function NoSessionState() {
  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'warning.light' }}>
      <Typography variant="h6">Session Not Available</Typography>
      <Typography variant="body1">
        Unable to load your user information. Please try logging in again.
      </Typography>
    </Paper>
  );
}
