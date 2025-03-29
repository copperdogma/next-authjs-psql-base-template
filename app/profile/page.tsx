import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ProfileContent from './components/ProfileContent';
import PageLayout from '@/components/layouts/PageLayout';

// This is a server component
export default function Profile() {
  return (
    <PageLayout title="Your Profile">
      <Suspense
        fallback={
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Box sx={{ mt: 2 }}>Loading profile data...</Box>
          </Box>
        }
      >
        <ProfileContent />
      </Suspense>
    </PageLayout>
  );
}
