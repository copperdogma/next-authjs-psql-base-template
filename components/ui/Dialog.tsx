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
import { ReactNode } from 'react';

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
  return (
    <MuiDialog
      {...props}
      onClose={onClose}
      aria-labelledby="dialog-title"
    >
      {(title || showCloseButton) && (
        <DialogTitle id="dialog-title" className="flex items-center justify-between">
          <div>{title}</div>
          {showCloseButton && onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              size="small"
              className="absolute right-2 top-2"
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
};

export default Dialog; 