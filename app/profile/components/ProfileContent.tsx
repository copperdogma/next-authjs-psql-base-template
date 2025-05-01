'use client';

import { useSession } from 'next-auth/react';
import { User } from 'next-auth';
import { Box, Paper } from '@mui/material';
import { useUserStore } from '@/lib/store/userStore';
import { UserRole } from '@/types';
import ProfileAvatarSection from './ProfileAvatarSection';
import ProfileDetailsSection from './ProfileDetailsSection';
import ProfileLoadingState from './ProfileLoadingState';
import ProfileErrorState from './ProfileErrorState';
import { loggers } from '@/lib/logger';

const profileLogger = loggers.ui;

export default function ProfileContent() {
  const { status } = useSession();
  const { id, name, email, image, role } = useUserStore();

  profileLogger.debug('[ProfileContent] Zustand store state', {
    id,
    name,
    email,
    hasImage: !!image,
    status,
  });

  if (status === 'loading') {
    profileLogger.info('Session status is loading...');
    return <ProfileLoadingState />;
  }

  if (!id) {
    profileLogger.warn('No user ID found in Zustand store', { status });
    return <ProfileErrorState />;
  }

  const userFromStore: User = {
    id,
    name: name ?? undefined,
    email: email ?? undefined,
    image: image ?? undefined,
    role: role ?? UserRole.USER,
  };

  profileLogger.info('Rendering profile content for user from store', { userId: id });

  return (
    <Paper
      id={id ? 'profile-content-authenticated' : 'profile-content-loading'}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
        border: 'none',
        boxShadow: 'none',
        backgroundImage: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 6 },
        }}
      >
        <ProfileAvatarSection user={userFromStore} />
        <ProfileDetailsSection user={userFromStore} />
      </Box>
    </Paper>
  );
}
