'use client';

import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  DialogProps as MuiDialogProps,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode, memo, useCallback } from 'react';

interface DialogProps extends Omit<MuiDialogProps, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

const Dialog = ({
  title,
  actions,
  showCloseButton = true,
  onClose,
  children,
  ...props
}: DialogProps) => {
  // Use useCallback to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <MuiDialog
      {...props}
      onClose={handleClose}
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby="dialog-description"
      PaperProps={{
        elevation: 24,
        className: 'overflow-hidden',
        ...(props.PaperProps || {})
      }}
    >
      {(title || showCloseButton) && (
        <DialogTitle 
          id="dialog-title" 
          className="flex items-center justify-between py-4 px-6"
        >
          <div className="text-xl font-semibold">{title}</div>
          {showCloseButton && onClose && (
            <IconButton
              aria-label="close dialog"
              onClick={handleClose}
              size="small"
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-full transition-colors"
              edge="end"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent id="dialog-description" className="px-6 py-4">
        {children}
      </DialogContent>
      {actions && (
        <DialogActions className="px-6 py-4 flex gap-2 border-t border-gray-100 dark:border-gray-800">
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(Dialog); 