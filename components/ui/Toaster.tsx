'use client';

import { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  AlertTitle,
  SnackbarProps as MuiSnackbarProps,
} from '@mui/material';

type ToastProps = {
  message: string;
  type?: AlertColor;
  title?: string;
  duration?: number;
};

interface ToasterProps {
  anchorOrigin?: MuiSnackbarProps['anchorOrigin'];
}

// Global state for the toast
let addToast: (toast: ToastProps) => void = () => {};

// Utility function for showing toast messages from anywhere in the app
export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    addToast({ message, type: 'success', title, duration });
  },
  error: (message: string, title?: string, duration?: number) => {
    addToast({ message, type: 'error', title, duration });
  },
  warning: (message: string, title?: string, duration?: number) => {
    addToast({ message, type: 'warning', title, duration });
  },
  info: (message: string, title?: string, duration?: number) => {
    addToast({ message, type: 'info', title, duration });
  },
};

export function Toaster({
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
}: ToasterProps = {}) {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Set up the addToast function to work globally
    addToast = (toast: ToastProps) => {
      setToasts(prev => [...prev, { ...toast, id: Date.now() }]);
    };

    return () => {
      addToast = () => {};
    };
  }, []);

  const handleClose = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (!mounted) return null;

  return (
    <>
      {toasts.map(toast => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration || 5000}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={anchorOrigin}
          sx={{ mb: toasts.indexOf(toast) * 8 }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.type || 'info'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
