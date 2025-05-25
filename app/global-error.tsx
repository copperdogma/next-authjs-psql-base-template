'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/client-logger';
// No PageLayout for global error as it might be too complex if layout itself fails.
// We'll use basic MUI components for a clean, safe error display.
import { Typography, Button, Paper, Container } from '@mui/material';
import { ReportProblemOutlined } from '@mui/icons-material'; // A different icon for global errors

let loggedError = false;

// Acceptable for a global error boundary
// which needs to be self-contained and may include fallback styles and structure.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (!loggedError) {
    clientLogger.error('GlobalErrorBoundary caught an error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest,
      },
      location: 'app/global-error.tsx',
    });
    loggedError = true;
  }

  useEffect(() => {
    loggedError = false;
    return () => {
      loggedError = false;
    };
  }, []);

  // IMPORTANT: Global error page should be simple and have minimal dependencies.
  // It should still attempt to use theme colors/fonts if possible but avoid complex layouts.
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Application Error</title>
        {/* Basic styling to ensure readability, MUI components will add more */}
        <style>
          {`
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: #f0f0f0; /* Light fallback background */
              color: #333; /* Basic text color */
            }
            /* Attempt to apply dark mode variables if they are globally available */
            @media (prefers-color-scheme: dark) {
              body {
                background-color: var(--background, #121212); /* Use theme var or fallback */
                color: var(--foreground, #eee); /* Use theme var or fallback */
              }
            }
          `}
        </style>
      </head>
      <body>
        <Container component="main" maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 2,
              // Attempt to use MUI theme variables if the theme context is somehow available or CSS variables are set globally
              bgcolor: 'var(--mui-palette-background-paper, #ffffff)', // Fallback to white
              color: 'var(--mui-palette-text-primary, #000000)', // Fallback to black
            }}
          >
            <ReportProblemOutlined
              sx={{
                fontSize: 60,
                color: 'var(--mui-palette-error-main, #d32f2f)', // Fallback to a standard red
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Application Error
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}
            >
              A critical error occurred in the application. We are working to resolve it. Please try
              again after some time.
            </Typography>
            <Button
              variant="contained"
              onClick={() => reset()}
              size="large"
              sx={{
                bgcolor: 'var(--mui-palette-primary-main, #1976d2)', // Fallback primary color
                '&:hover': { bgcolor: 'var(--mui-palette-primary-dark, #1565c0)' }, // Fallback hover
              }}
            >
              Try again
            </Button>
          </Paper>
        </Container>
      </body>
    </html>
  );
}
