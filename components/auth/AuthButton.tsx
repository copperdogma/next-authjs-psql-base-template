'use client';

import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface AuthButtonProps {
  isLoading: boolean;
  isSignedIn: boolean;
  theme: string | undefined;
  onClick: () => void;
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  onClick,
  isLoading = false,
  isSignedIn = false,
  theme,
  className,
  ...props
}) => {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      color={isSignedIn ? 'error' : 'primary'}
      data-testid="auth-button"
      data-loading={String(isLoading)}
      data-theme={theme}
      disabled={isLoading}
      startIcon={!isLoading ? isSignedIn ? <LogoutIcon /> : <GoogleIcon /> : undefined}
      sx={{
        minWidth: '160px',
        position: 'relative',
      }}
      className={className}
      {...props}
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
};

export default AuthButton;
