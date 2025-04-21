'use client';

import { Stack, Button } from '@mui/material';
import { signOut } from 'next-auth/react';
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
        <Button
          variant="contained"
          color="secondary"
          onClick={() => signOut({ callbackUrl: '/login' })}
          sx={{ alignSelf: 'flex-start' }}
        >
          Sign Out (Debug)
        </Button>
        <WelcomeSection />
        <FeaturesSection />
      </Stack>
    </PageLayout>
  );
}
