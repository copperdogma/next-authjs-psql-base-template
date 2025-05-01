'use client';

import React, { useEffect } from 'react';
// import { useSession } from 'next-auth/react'; // No longer needed here
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import { Avatar, Box, /* Typography, */ Skeleton, Chip } from '@mui/material';
import NextLink from 'next/link';

// Extracted loader component to reduce complexity
const UserProfileSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} data-testid="profile-loading">
    <Skeleton variant="circular" width={32} height={32} />
    <Skeleton variant="text" width={80} />
  </Box>
);

// Extracted authenticated component to reduce complexity
const AuthenticatedProfile = ({
  user,
}: {
  user: { id: string; name?: string | null; image?: string | null; email?: string | null };
}) => {
  const { name, image, email } = user;
  const displayName = name ?? email ?? 'User'; // Fallback logic
  const altText = name ?? email ?? 'User Avatar'; // Alt text for avatar

  return (
    <NextLink href="/profile" passHref legacyBehavior={false} style={{ textDecoration: 'none' }}>
      <Chip
        avatar={
          <Avatar
            src={image ?? undefined}
            alt={altText}
            sx={{ width: 32, height: 32 }}
            data-testid="profile-image"
          />
        }
        label={displayName}
        variant="outlined" // Use outlined variant for better visibility
        sx={{
          cursor: 'pointer',
          height: 'auto',
          padding: '4px', // Add some padding
          '& .MuiChip-label': {
            // Ensure label doesn't get too small
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '150px', // Limit max width
            display: { xs: 'none', sm: 'block' }, // Keep responsive display
          },
          '&:hover': {
            backgroundColor: theme => theme.palette.action.hover,
          },
        }}
        data-testid="user-profile-chip"
      />
      {/* Removed the Box and Typography, now handled by Chip */}
    </NextLink>
  );
};

/**
 * UserProfile component displays user avatar and name when logged in.
 * Reads user details from the global Zustand store.
 */
const UserProfile: React.FC = () => {
  // Read user details directly from the Zustand store
  const { id, name, email, image } = useUserStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    console.log('[UserProfile] Mounted'); // Log mount
    setMounted(true);
  }, []);

  // Log store changes
  useEffect(() => {
    console.log(`[UserProfile] Store updated:`, { id, name, email, image });
  }, [id, name, email, image]);

  // Show skeleton loader if not mounted yet
  if (!mounted) {
    console.log(`[UserProfile] Rendering Skeleton (not mounted yet)`);
    return <UserProfileSkeleton />;
  }

  // If mounted and we have an ID from the store, assume authenticated
  if (id) {
    console.log('[UserProfile] Rendering Authenticated state from store');
    return <AuthenticatedProfile user={{ id, name, email, image }} />;
  }

  // Handle unauthenticated state (no ID in store)
  console.log(`[UserProfile] Rendering Unauthenticated state (no ID in store)`);
  return null;
};

export default UserProfile;
