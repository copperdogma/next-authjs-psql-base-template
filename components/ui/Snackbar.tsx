'use client';

import {
  Snackbar as MuiSnackbar,
  Alert as MuiAlert,
  SnackbarProps as MuiSnackbarProps,
  AlertProps,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { forwardRef, memo, useCallback } from 'react';

export interface SnackbarProps extends Omit<MuiSnackbarProps, 'children'> {
  message?: string;
  severity?: AlertProps['severity'];
  onClose?: () => void;
  showCloseButton?: boolean;
  title?: string;
  autoHideDuration?: number;
  variant?: 'filled' | 'outlined' | 'standard';
  elevation?: number;
}

const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(
  (
    {
      message,
      severity = 'info',
      onClose,
      showCloseButton = true,
      title,
      autoHideDuration = 6000,
      variant = 'filled',
      elevation = 6,
      ...props
    },
    ref
  ) => {
    const handleClose = useCallback(() => {
      if (onClose) onClose();
    }, [onClose]);

    return (
      <MuiSnackbar
        {...props}
        ref={ref}
        onClose={handleClose}
        autoHideDuration={autoHideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={showCloseButton ? handleClose : undefined}
          severity={severity}
          variant={variant}
          className="w-full shadow-lg rounded-lg"
          elevation={elevation}
          action={
            showCloseButton && (
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          }
        >
          {title && <div className="font-medium mb-0.5">{title}</div>}
          <div>{message}</div>
        </MuiAlert>
      </MuiSnackbar>
    );
  }
);

Snackbar.displayName = 'Snackbar';

// Memoize to prevent unnecessary re-renders
export default memo(Snackbar);
