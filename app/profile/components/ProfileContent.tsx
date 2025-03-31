'use client';

import { useSession, signOut } from 'next-auth/react';
import { Box, Paper, Typography, Button, Avatar, Divider, Stack } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import Image from 'next/image';

export default function ProfileContent() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate initials for the avatar if no photo URL
  const getInitials = () => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase();
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
            pt: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            {user.image ? (
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  mx: 'auto',
                  mb: 3,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: 3,
                }}
              >
                <Image
                  src={user.image}
                  alt={user.name || 'User profile'}
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
                  mb: 3,
                  fontSize: '4.5rem',
                  bgcolor: 'primary.main',
                  boxShadow: 3,
                }}
              >
                {getInitials()}
              </Avatar>
            )}
            <Typography variant="h6" gutterBottom>
              {user.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user.email ? 'Verified Account' : 'Unverified Account'}
            </Typography>
          </Box>
        </Box>

        {/* Profile Information */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' },
            pt: { xs: 0, md: 3 },
          }}
        >
          <Stack spacing={4}>
            <Box sx={{ pb: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 500, display: 'block', mb: 1 }}
              >
                Display Name
              </Typography>
              <Typography variant="h6">{user.name || 'Not provided'}</Typography>
            </Box>

            <Divider />

            <Box sx={{ py: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 500, display: 'block', mb: 1 }}
              >
                Email
              </Typography>
              <Typography variant="h6">{user.email || 'Not provided'}</Typography>
            </Box>

            <Divider />

            <Box sx={{ py: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 500, display: 'block', mb: 1 }}
              >
                User ID
              </Typography>
              <Typography variant="h6">{user.id || 'Not available'}</Typography>
            </Box>

            <Divider />

            <Box sx={{ pt: 3, pb: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={handleSignOut}
                startIcon={<LogoutOutlined />}
                size="large"
                sx={{ px: 3 }}
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
