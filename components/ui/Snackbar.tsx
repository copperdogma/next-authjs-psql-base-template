'use client';

import {
  Snackbar as MuiSnackbar,
  Alert as MuiAlert,
  SnackbarProps as MuiSnackbarProps,
  AlertProps,
} from '@mui/material';
import { forwardRef, memo } from 'react';

interface SnackbarProps extends Omit<MuiSnackbarProps, 'children'> {
  message?: string;
  severity?: AlertProps['severity'];
  onClose?: () => void;
}

const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(
  ({ message, severity = 'info', onClose, ...props }, ref) => {
    return (
      <MuiSnackbar
        {...props}
        ref={ref}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={onClose}
          severity={severity}
          variant="filled"
          className="w-full shadow-lg"
        >
          {message}
        </MuiAlert>
      </MuiSnackbar>
    );
  }
);

Snackbar.displayName = 'Snackbar';

// Memoize to prevent unnecessary re-renders
const MemoSnackbar = memo(Snackbar);
export default MemoSnackbar; 