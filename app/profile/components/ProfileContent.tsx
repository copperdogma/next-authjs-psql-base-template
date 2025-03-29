'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { signOut } from '@firebase/auth';
import { auth } from '@/lib/firebase';
import type { Auth } from '@firebase/auth';
import { Box, Paper, Typography, Button, Avatar, Divider, Stack } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import Image from 'next/image';

export default function ProfileContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      if ('signOut' in auth) {
        await signOut(auth as Auth);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate initials for the avatar if no photo URL
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

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
        {/* Profile Image */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '0 0 250px' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            {user.photoURL ? (
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  mx: 'auto',
                  mb: 2.5,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: 2,
                }}
              >
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            ) : (
              <Avatar
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
                {getInitials()}
              </Avatar>
            )}
            <Typography variant="h6" gutterBottom>
              {user.displayName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.emailVerified ? 'Verified Account' : 'Unverified Account'}
            </Typography>
          </Box>
        </Box>

        {/* Profile Information */}
        <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
                Display Name
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {user.displayName || 'Not provided'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
                Email
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {user.email}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
                Email Verified
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {user.emailVerified ? 'Yes' : 'No'}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ pt: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={handleSignOut}
                startIcon={<LogoutOutlined />}
                size="large"
              >
                Sign Out
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
