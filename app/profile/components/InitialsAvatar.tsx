'use client';

import { Avatar } from '@mui/material';

interface InitialsAvatarProps {
  initials: string;
}

export default function InitialsAvatar({ initials }: InitialsAvatarProps) {
  return (
    <Avatar
      id="profile-initials-avatar"
      sx={{
        width: 180,
        height: 180,
        mx: 'auto',
        mb: 2.5,
        fontSize: '4.5rem',
        bgcolor: 'primary.main',
        boxShadow: 2,
      }}
    >
      {initials}
    </Avatar>
  );
}
