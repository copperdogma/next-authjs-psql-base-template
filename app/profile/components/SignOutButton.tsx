'use client';

import { Box, Button } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { signOut } from 'next-auth/react';

/**
 * Sign out button component for profile page.
 */
export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
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
  );
}
