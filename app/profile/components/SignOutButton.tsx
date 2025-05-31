'use client';

import { Box, Button } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { signOutWithLogging } from '@/lib/auth-logging';
import { clientLogger } from '@/lib/client-logger';

/**
 * Sign out button component for profile page.
 */
export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOutWithLogging({ callbackUrl: '/' });
    } catch (error) {
      clientLogger.error('Error signing out', { error });
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
