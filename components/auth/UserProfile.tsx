'use client';

import React, { useEffect, useState, memo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../app/providers/AuthProvider';
import { Avatar, Box, Skeleton, Tooltip, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const UserProfile = () => {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading skeleton during server rendering or loading
  if (!mounted || loading) {
    return (
      <Box data-testid="profile-loading" sx={{ display: 'inline-flex', mx: 1 }}>
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
    );
  }

  // Return nothing if not authenticated
  if (!user) {
    return null;
  }

  return (
    <Tooltip title="Profile">
      <IconButton
        component={Link}
        href="/profile"
        aria-label="User profile"
        data-testid="user-profile"
        sx={{ p: 0, ml: 1 }}
      >
        {user.photoURL ? (
          <Avatar
            alt={user.displayName || 'User profile'}
            src={user.photoURL}
            sx={{ width: 36, height: 36 }}
            imgProps={{
              referrerPolicy: 'no-referrer',
              crossOrigin: 'anonymous',
            }}
            data-testid="profile-image"
          />
        ) : (
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            {user.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : user.email ? (
              user.email.charAt(0).toUpperCase()
            ) : (
              <AccountCircle />
            )}
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
          {user.displayName || 'Anonymous'}
        </Box>
      </IconButton>
    </Tooltip>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(UserProfile);
