'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Box, Tooltip, IconButton } from '@mui/material';
import ProfileAvatar from './ProfileAvatar';
import ProfileLoadingSkeleton from './ProfileLoadingSkeleton';

const UserProfile = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  // Show loading skeleton during loading or initial mount
  if (status === 'loading') {
    return <ProfileLoadingSkeleton />;
  }

  // Return nothing if not authenticated
  if (!user) {
    return null;
  }

  return (
    <Tooltip title="Profile" placement="bottom">
      <IconButton
        component={Link}
        href="/profile"
        aria-label="User profile"
        data-testid="user-profile"
        sx={{ p: 0, ml: 1 }}
      >
        <ProfileAvatar user={user} />
        <Box
          component="span"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            top: -9999,
            left: -9999,
          }}
          data-testid="profile-name"
        >
          {user.name || 'User Profile'}
        </Box>
      </IconButton>
    </Tooltip>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(UserProfile);
