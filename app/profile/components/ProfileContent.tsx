'use client';

import { useSession } from 'next-auth/react';
import { Box, Paper } from '@mui/material';
import ProfileAvatarSection from './ProfileAvatarSection';
import ProfileDetailsSection from './ProfileDetailsSection';

export default function ProfileContent() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

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
