'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { getDisplayErrorMessage } from '@/lib/utils/error-display';
import { Typography, Button, Paper, Box, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    clientLogger.error('Dashboard error', { error });
  }, [error]);

  const displayMessage = getDisplayErrorMessage(
    error,
    'An unexpected error occurred while loading the dashboard.'
  );

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 60,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Something went wrong!
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}
        >
          {displayMessage}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
          <Button variant="contained" onClick={() => reset()} size="large">
            Try again
          </Button>
          <Button variant="outlined" href="/" size="large">
            Return to home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
