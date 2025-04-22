'use client';

import { useSession } from 'next-auth/react';
import { Box, Paper } from '@mui/material';
import ProfileAvatarSection from './ProfileAvatarSection';
import ProfileDetailsSection from './ProfileDetailsSection';
import { loggers } from '@/lib/logger';

const profileLogger = loggers.ui;

export default function ProfileContent() {
  const { data: session, status } = useSession();

  profileLogger.debug('[ProfileContent] useSession status and data', { 
    status, 
    hasSessionData: !!session, 
    hasUserData: !!session?.user, 
    userId: session?.user?.id 
  });

  const user = session?.user;

  if (status === 'loading') {
    profileLogger.info('Session status is loading...');
    return null;
  }

  if (!user) {
    profileLogger.warn('No user data found in session', { status });
    return null;
  }

  profileLogger.info('Rendering profile content for user', { userId: user.id });

  return (
    <Paper
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
