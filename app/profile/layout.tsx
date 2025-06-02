import { Suspense } from 'react';
import { Metadata } from 'next';
import { Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'Profile | Next.js Template',
  description: 'Manage your user profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <main>
        <Suspense
          fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Loading profile content...</Box>}
        >
          {children}
        </Suspense>
      </main>
    </Box>
  );
}
