'use client';

import { Stack } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';
import WelcomeSection from './components/home/WelcomeSection';
import FeaturesSection from './components/home/FeaturesSection';

export default function HomePage() {
  return (
    <PageLayout
      title="Welcome to Next.js Template"
      subtitle="A starter template with Next.js, NextAuth.js and PostgreSQL"
    >
      <Stack spacing={4}>
        <WelcomeSection />
        <FeaturesSection />
      </Stack>
    </PageLayout>
  );
}
