'use client';

import { useSession } from 'next-auth/react';
import { Box, Paper } from '@mui/material';
import ProfileAvatarSection from './ProfileAvatarSection';
import ProfileDetailsSection from './ProfileDetailsSection';
import ProfileLoadingState from './ProfileLoadingState';
import ProfileErrorState from './ProfileErrorState';
import { loggers } from '@/lib/logger';

const profileLogger = loggers.ui;

export default function ProfileContent() {
  const { data: session, status } = useSession();

  // TEMPORARY E2E DEBUG LOGGING
  // console.log(`[E2E DEBUG] ProfileContent - Status: ${status}`);
  // console.log(`[E2E DEBUG] ProfileContent - Session Data: ${JSON.stringify(session, null, 2)}`);
  // END TEMPORARY E2E DEBUG LOGGING

  profileLogger.debug('[ProfileContent] useSession status and data', { 
    status, 
    hasSessionData: !!session, 
    hasUserData: !!session?.user, 
    userId: session?.user?.id 
  });

  if (status === 'loading') {
    profileLogger.info('Session status is loading...');
    return <ProfileLoadingState />;
  }

  const user = session?.user;

  if (!user) {
    profileLogger.warn('No user data found in session', { status });
    return <ProfileErrorState />;
  }

  profileLogger.info('Rendering profile content for user', { userId: user.id });
  // ADDED E2E DEBUG LOG
  // console.log(`[E2E DEBUG] ProfileContent rendering MAIN content (User ID: ${user.id})`);

  return (
    <Paper
      id={status === 'authenticated' ? 'profile-content-authenticated' : 'profile-content-loading'}
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 6 },
        }}
      >
        <ProfileAvatarSection user={user} />
        <ProfileDetailsSection user={user} />
      </Box>
    </Paper>
  );
}
