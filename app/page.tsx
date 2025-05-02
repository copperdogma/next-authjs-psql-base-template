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

// Example: Welcome Section (using Card)
const WelcomeSection = () => (
  <Card
    // variant="outlined"
    sx={{
      border: 'none',
      boxShadow: 'none',
      backgroundImage: 'none',
    }}
  >
    <CardHeader title="Welcome Back!" />
    <CardContent>
      <Typography variant="body1" paragraph>
        This is your main dashboard. You can add summaries, quick links, or other relevant
        information here.
      </Typography>
      {/* Adjust content as needed for the actual home page */}
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
    <CardHeader title="Quick Links / Features" />
    <CardContent>
      <Typography variant="body1" paragraph>
        Placeholder for key features or quick links within the application.
      </Typography>
      {/* Add buttons, lists, or other feature representations */}
      <Stack direction="row" spacing={2}>
        <Button variant="contained">Feature 1</Button>
        <Button variant="outlined">Feature 2</Button>
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
      subtitle={`Welcome ${session?.user?.name ?? 'to {YOUR_APP_NAME}'}`} // Personalized subtitle
    >
      <Stack spacing={3}>
        {' '}
        {/* Use Stack for vertical spacing */}
        <WelcomeSection />
        <FeaturesSection />
      </Stack>
    </PageLayout>
  );
}
