'use client';

import { useEffect } from 'react';
// Removed Link from 'next/link' as MUI Button with href will handle it
import { clientLogger } from '@/lib/client-logger';
import PageLayout from '@/components/layouts/PageLayout'; // Added PageLayout
import { Typography, Button, Paper, Box, Container } from '@mui/material'; // Added MUI components
import { ErrorOutline } from '@mui/icons-material'; // Added MUI icon

// Log the error as soon as the boundary catches it
let loggedError = false; // Prevent logging multiple times on re-renders

interface ErrorComponentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/* eslint-disable max-lines-per-function */ // Acceptable for error boundary components
// which often contain detailed fallback UI and recovery logic within a single file for clarity.
const ErrorBoundary = ({ error, reset }: ErrorComponentProps) => {
  // Log the error immediately on the client, sending it to the server
  if (!loggedError) {
    clientLogger.error('ErrorBoundary caught an error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest,
      },
      location: 'app/error.tsx',
    });
    loggedError = true;
  }

  useEffect(() => {
    loggedError = false;
    return () => {
      loggedError = false;
    };
  }, []);

  return (
    // Using PageLayout for consistency, assuming a title isn't strictly needed or can be generic
    <PageLayout title="Error" subtitle="Something Went Wrong">
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
            // Assuming theme variables are available for background and text
            // bgcolor: 'background.paper', // Or use var(--mui-palette-background-paper)
            // color: 'text.primary', // Or use var(--mui-palette-text-primary)
          }}
          // className="theme-aware-paper" // Add if you have specific global styles for themed paper
        >
          <ErrorOutline
            sx={{
              fontSize: 60, // Adjusted size
              color: 'error.main', // Using theme error color
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
            {error.message || 'An unexpected error occurred. We apologize for the inconvenience.'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={() => reset()} size="large">
              Try again
            </Button>
            <Button
              variant="outlined" // Changed to outlined for secondary action
              href="/"
              size="large"
              // component={Link} // Not needed if href is used directly with MUI Button + Next.js
            >
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </PageLayout>
  );
};
/* eslint-enable max-lines-per-function */

export default ErrorBoundary;
