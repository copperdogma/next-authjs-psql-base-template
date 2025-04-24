import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ProfileContent from './components/ProfileContent';
import PageLayout from '@/components/layouts/PageLayout';

// This is a server component
export default function Profile() {
  return (
    <PageLayout title="Your Profile">
      {/* Add a simple marker element for E2E testing */}
      <div data-testid="profile-page-marker" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>PROFILE_PAGE_LOADED</div>
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
