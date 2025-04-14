'use client';

import { DialogActions, DialogActionsProps } from '@mui/material';
import { ReactNode } from 'react';

interface DialogFooterProps extends DialogActionsProps {
  actions?: ReactNode;
}

export default function DialogFooter({ actions, children, sx, ...props }: DialogFooterProps) {
  const content = actions || children;
  if (!content) return null;

  return (
    <DialogActions
      {...props}
      sx={{
        px: 3,
        py: 2,
        display: 'flex',
        gap: 1,
        borderTop: 1,
        borderColor: 'divider',
        ...(sx || {}),
      }}
    >
      {content}
    </DialogActions>
  );
}
