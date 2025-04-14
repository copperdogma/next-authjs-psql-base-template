'use client';

import { Dialog as MuiDialog, DialogProps as MuiDialogProps } from '@mui/material';
import { ReactNode, memo, useCallback } from 'react';
import DialogHeader from './DialogHeader';
import DialogBody from './DialogBody';
import DialogFooter from './DialogFooter';

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
  PaperProps,
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
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby="dialog-description"
      PaperProps={{
        elevation: 24,
        sx: {
          overflow: 'hidden',
          ...(PaperProps?.sx || {}),
        },
        ...PaperProps,
      }}
    >
      <DialogHeader title={title} showCloseButton={showCloseButton} onClose={handleClose} />
      <DialogBody>{children}</DialogBody>
      <DialogFooter actions={actions} />
    </MuiDialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(Dialog);
