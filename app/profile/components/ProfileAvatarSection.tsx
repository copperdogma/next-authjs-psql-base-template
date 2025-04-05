'use client';

import { Box, Typography } from '@mui/material';
import { User } from 'next-auth';
import UserAvatar from './UserAvatar';

interface ProfileAvatarSectionProps {
  user: User;
}

export default function ProfileAvatarSection({ user }: ProfileAvatarSectionProps) {
  return (
    <Box
      sx={{
        flex: { xs: '1 1 auto', md: '0 0 250px' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <UserAvatar user={user} />
        <Typography variant="h6" gutterBottom>
          {user.name || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email ? 'Verified Account' : 'Unverified Account'}
        </Typography>
      </Box>
    </Box>
  );
}
