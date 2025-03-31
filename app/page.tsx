'use client';

import React, { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import Link from 'next/link';
import PageLayout from '@/components/layouts/PageLayout';
import { useSession, signIn } from 'next-auth/react';
import { Google as GoogleIcon } from '@mui/icons-material';

export default function Home() {
  const { data: session, status } = useSession();

  // Handle sign in with Google
  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <PageLayout
      title="Welcome to Next.js Template"
      subtitle="A starter template with Next.js, NextAuth.js and PostgreSQL"
    >
      <Stack spacing={4}>
        <Paper
          elevation={1}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
            Get Started
          </Typography>
          <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto' }}>
            This template provides a solid foundation for your next web application, including
            authentication, database integration, and a clean UI built with Material UI.
          </Typography>
          <Box sx={{ mt: 3 }}>
            {session ? (
              // Show dashboard and profile buttons for authenticated users
              <>
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="contained"
                  size="large"
                  sx={{ mr: 2 }}
                >
                  Dashboard
                </Button>
                <Button component={Link} href="/profile" variant="outlined" size="large">
                  Profile
                </Button>
              </>
            ) : (
              // Show sign-in button for unauthenticated users
              <ErrorBoundary
                fallback={
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'warning.main',
                      borderRadius: 1,
                      bgcolor: 'warning.light',
                    }}
                  >
                    Authentication component failed to load. Please refresh the page.
                  </Box>
                }
              >
                <Button
                  onClick={handleSignIn}
                  variant="contained"
                  size="large"
                  startIcon={<GoogleIcon />}
                >
                  Sign in with Google
                </Button>
              </ErrorBoundary>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 4 },
                height: '100%',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2 }}>
                Next.js
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modern React framework with server-side rendering, file-based routing, and optimized
                performance.
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 4 },
                height: '100%',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2 }}>
                NextAuth.js
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure user authentication with Google sign-in and session management built in.
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 4 },
                height: '100%',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2 }}>
                PostgreSQL
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powerful relational database integration for robust data storage and management.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Stack>
    </PageLayout>
  );
}
