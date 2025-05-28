'use client';

import React from 'react';
import {
  Stack,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  CircularProgress,
} from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';
import { useSession } from 'next-auth/react';
import { CombinedLoginOptions } from '@/components/auth/CombinedLoginOptions';

// --- Recreating Content Sections with MUI ---

/**
 * Home Page Components
 * -------------------
 * The components below provide a minimal, clean starting point for the authenticated home page.
 * You should customize these components with your application's specific features and branding.
 *
 * Consider:
 * - Replacing placeholder text with actual content relevant to your application
 * - Adding real quick links to important features of your application
 * - Including user-specific data summaries or statistics
 * - Integrating your brand colors and styling
 */

// Example: Welcome Section (using Card)
const WelcomeSection = ({ userName }: { userName: string | null }) => (
  <Card
    // variant="outlined"
    sx={{
      border: 'none',
      boxShadow: 'none',
      backgroundImage: 'none',
    }}
  >
    <CardHeader title={`Welcome ${userName || 'to your dashboard'}!`} />
    <CardContent>
      <Typography variant="body1" paragraph>
        This is your personalized dashboard. Here you can access all the features of the application
        and get an overview of your current status and activities.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your account is active and fully set up. Use the quick links below to navigate to key
        features.
      </Typography>
    </CardContent>
  </Card>
);

// Example: Features/Quick Links Section (using Card)
const FeaturesSection = () => (
  <Card
    // variant="outlined"
    sx={{
      border: 'none',
      boxShadow: 'none',
      backgroundImage: 'none',
    }}
  >
    <CardHeader title="Quick Links" />
    <CardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
        <Stack sx={{ flex: '1 1 30%', minWidth: '240px' }}>
          <Button variant="contained" fullWidth sx={{ mb: 1 }}>
            My Profile
          </Button>
          <Typography variant="body2" color="text.secondary">
            View and edit your account details
          </Typography>
        </Stack>
        <Stack sx={{ flex: '1 1 30%', minWidth: '240px' }}>
          <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
            Settings
          </Button>
          <Typography variant="body2" color="text.secondary">
            Configure your preferences
          </Typography>
        </Stack>
        <Stack sx={{ flex: '1 1 30%', minWidth: '240px' }}>
          <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
            Help Center
          </Button>
          <Typography variant="body2" color="text.secondary">
            Documentation and support
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

// --- Home Page Component --- // Renamed component
export default function HomePage() {
  const { data: session, status } = useSession();

  // Loading state
  if (status === 'loading') {
    return (
      <PageLayout title="Home" subtitle="Loading...">
        <Grid container justifyContent="center" alignItems="center" minHeight="50vh">
          <Grid>
            <CircularProgress />
          </Grid>
        </Grid>
      </PageLayout>
    );
  }

  // Unauthenticated state: Show Login Component
  if (status === 'unauthenticated') {
    // We don't use PageLayout here as CombinedLoginOptions provides its own card structure
    return <CombinedLoginOptions />;
  }

  // Authenticated state: Show Welcome Content
  return (
    <PageLayout
      title="Home" // Updated title
      subtitle={`Dashboard`} // Simplified subtitle
    >
      <Stack spacing={3}>
        {' '}
        {/* Use Stack for vertical spacing */}
        <WelcomeSection userName={session?.user?.name || null} />
        <FeaturesSection />
      </Stack>
    </PageLayout>
  );
}
