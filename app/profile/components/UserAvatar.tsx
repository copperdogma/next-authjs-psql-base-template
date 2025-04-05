'use client';

import { Box } from '@mui/material';
import { User } from 'next-auth';
import AvatarImage from './AvatarImage';
import InitialsAvatar from './InitialsAvatar';

interface UserAvatarProps {
  user: User;
}

/**
 * Renders the user's avatar or initials.
 */
export default function UserAvatar({ user }: UserAvatarProps) {
  const getInitials = () => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {user.image ? (
        <AvatarImage src={user.image} alt={user.name || 'User profile'} />
      ) : (
        <InitialsAvatar initials={getInitials()} />
      )}
    </Box>
  );
}
