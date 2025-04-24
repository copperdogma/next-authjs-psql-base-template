'use client';

import { Paper, Typography, CircularProgress } from '@mui/material';

export default function ProfileLoadingState() {
  return (
    <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
      <CircularProgress size={30} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Loading profile data...
      </Typography>
    </Paper>
  );
}
