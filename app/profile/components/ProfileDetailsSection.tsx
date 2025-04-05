'use client';

import { Box, Typography, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';

interface ProfileDetailsSectionProps {
  user: User;
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
            Display Name
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.name || 'Not provided'}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
            Email
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.email || 'Not provided'}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
            User ID
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.id || 'Not available'}
          </Typography>
        </Box>

        <Divider />

        <SignOutButton />
      </Stack>
    </Box>
  );
}
