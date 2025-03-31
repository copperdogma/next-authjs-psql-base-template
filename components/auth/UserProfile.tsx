'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Avatar, Box, Skeleton, Tooltip, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const UserProfile = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  // Show loading skeleton during loading or initial mount
  if (status === 'loading') {
    return (
      <Box data-testid="profile-loading" sx={{ display: 'inline-flex', mx: 1 }}>
        <Skeleton variant="circular" width={36} height={36} />
      </Box>
    );
  }

  // Return nothing if not authenticated
  if (!user) {
    return null;
  }

  // Determine initials or use AccountCircle icon
  const getInitials = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return null; // Will fall back to icon
  };
  const userInitials = getInitials();

  return (
    <Tooltip title="Profile" placement="bottom">
      <IconButton
        component={Link}
        href="/profile"
        aria-label="User profile"
        data-testid="user-profile"
        sx={{ p: 0, ml: 1 }}
      >
        {user.image ? (
          <Avatar
            alt={user.name || 'User profile'}
            src={user.image}
            sx={{ width: 36, height: 36 }}
            imgProps={{
              referrerPolicy: 'no-referrer',
              crossOrigin: 'anonymous',
            }}
            data-testid="profile-image"
          />
        ) : (
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            {userInitials || <AccountCircle />}
          </Avatar>
        )}
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
