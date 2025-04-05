'use client';

import { Button, CircularProgress } from '@mui/material';

export default function LoadingAuthButton() {
  return (
    <Button
      disabled
      data-testid="auth-button-placeholder"
      variant="contained"
      sx={{ minWidth: '160px' }}
    >
      <CircularProgress size={20} sx={{ mr: 1, color: 'action.disabled' }} />
      Loading...
    </Button>
  );
}
