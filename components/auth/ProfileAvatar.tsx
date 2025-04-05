'use client';

import { User } from 'next-auth';
import { Avatar } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

interface ProfileAvatarProps {
  user: User;
}

export default function ProfileAvatar({ user }: ProfileAvatarProps) {
  // Determine initials or use AccountCircle icon
  const getInitials = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return null; // Will fall back to icon
  };
  const userInitials = getInitials();

  if (user.image) {
    return (
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
    );
  }

  return (
    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
      {userInitials || <AccountCircle />}
    </Avatar>
  );
}
