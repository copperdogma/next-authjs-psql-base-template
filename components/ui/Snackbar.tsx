'use client';

import {
  Snackbar as MuiSnackbar,
  Alert as MuiAlert,
  SnackbarProps as MuiSnackbarProps,
  AlertProps,
  IconButton,
  Typography,
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
  anchorOrigin?: MuiSnackbarProps['anchorOrigin'];
}

// Extract the Alert content to a separate component
const AlertContent = ({ title, message }: { title?: string; message?: string }) => (
  <>
    {title && (
      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', mb: 0.5 }}>
        {title}
      </Typography>
    )}
    <Typography variant="body2" component="div">
      {message}
    </Typography>
  </>
);

// Extract the close button to a separate component
const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
    <CloseIcon fontSize="small" />
  </IconButton>
);

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
      anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
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
        anchorOrigin={anchorOrigin}
      >
        <MuiAlert
          onClose={showCloseButton ? handleClose : undefined}
          severity={severity}
          variant={variant}
          sx={{ width: '100%', boxShadow: 3, borderRadius: 1 }}
          elevation={elevation}
          action={showCloseButton ? <CloseButton onClose={handleClose} /> : undefined}
        >
          <AlertContent title={title} message={message} />
        </MuiAlert>
      </MuiSnackbar>
    );
  }
);

Snackbar.displayName = 'Snackbar';

export default memo(Snackbar);
