'use client';

import { Box, Stack } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';

// Import the modular components
import ProjectOverview from './components/ProjectOverview';
import CoreTechnologies from './components/CoreTechnologies';
import KeyFeatures from './components/KeyFeatures';
import GettingStarted from './components/GettingStarted';

/**
 * About page using modular components for better code organization
 */
export default function AboutPage() {
  return (
    <PageLayout
      title="About This Template"
      subtitle="Next.js, Firebase Authentication, and PostgreSQL Starter Template"
    >
      <Stack spacing={4}>
        {/* Project Overview Section */}
        <ProjectOverview />

        {/* Features Section */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <CoreTechnologies />
          <KeyFeatures />
        </Box>

        {/* Getting Started Section */}
        <GettingStarted />
      </Stack>
    </PageLayout>
  );
}
