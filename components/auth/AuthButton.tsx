'use client';

import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface AuthButtonProps {
  isLoading: boolean;
  isSignedIn: boolean;
  theme: string | undefined;
  onClick: () => void;
}

export default function AuthButton({ isLoading, isSignedIn, theme, onClick }: AuthButtonProps) {
  return (
    <Button
      onClick={onClick}
      color={isSignedIn ? 'error' : 'primary'}
      variant="contained"
      data-testid="auth-button"
      data-loading={isLoading ? 'true' : 'false'}
      data-theme={theme} // Add theme data attribute for testing
      disabled={isLoading}
      startIcon={!isLoading ? isSignedIn ? <LogoutIcon /> : <GoogleIcon /> : undefined}
      sx={{
        minWidth: '160px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <CircularProgress
          size={20}
          sx={{
            position: 'absolute',
            left: 15,
            color: 'inherit',
          }}
        />
      )}
      {isLoading
        ? isSignedIn
          ? 'Signing Out...'
          : 'Signing In...'
        : isSignedIn
          ? 'Sign Out'
          : 'Sign In with Google'}
    </Button>
  );
}
