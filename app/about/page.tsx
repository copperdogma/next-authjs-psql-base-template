'use client';

import { Box, Stack, Button, Card, CardHeader, CardContent, Grid } from '@mui/material';
import { signOutWithLogging } from '@/lib/auth-logging'; // Import signOutWithLogging
import PageLayout from '@/components/layouts/PageLayout';

// Import the modular components (assuming these exist or will be created)
import ProjectOverview from './components/ProjectOverview';
import CoreTechnologies from './components/CoreTechnologies';
import KeyFeatures from './components/KeyFeatures';
import GettingStarted from './components/GettingStarted';

/**
 * About page using modular components for better code organization
 */
export default function AboutPage() {
  const handleLogout = () => {
    signOutWithLogging({ callbackUrl: '/login' }); // Redirect to login after sign out
  };

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <PageLayout
      title="About This Template"
      subtitle="Next.js, NextAuth.js, and PostgreSQL Starter Template"
    >
      <Stack spacing={4}>
        {/* Project Overview Section */}
        <ProjectOverview />

        {/* Features Section */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <CoreTechnologies />
          <KeyFeatures />
        </Box>

        {/* Quick Actions Section */}
        <Card sx={{ border: 'none', boxShadow: 'none', backgroundImage: 'none' }}>
          <CardHeader title="Quick Actions" />
          <CardContent>
            <Grid container spacing={2}>
              {isDevelopment && (
                <Grid
                  size={{
                    xs: 12,
                    sm: 4,
                  }}
                >
                  <Button variant="outlined" color="warning" fullWidth onClick={handleLogout}>
                    Debug Log Out
                  </Button>
                </Grid>
              )}
              {/* Add other quick actions here if needed */}
            </Grid>
          </CardContent>
        </Card>

        {/* Getting Started Section */}
        <GettingStarted />
      </Stack>
    </PageLayout>
  );
}
