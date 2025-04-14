'use client';

import { DialogContent, DialogContentProps } from '@mui/material';
import { ReactNode } from 'react';

interface DialogBodyProps extends DialogContentProps {
  children: ReactNode;
}

export default function DialogBody({ children, sx, ...props }: DialogBodyProps) {
  return (
    <DialogContent
      id="dialog-description"
      {...props}
      sx={{
        px: 3,
        py: 2,
        ...(sx || {}),
      }}
    >
      {children}
    </DialogContent>
  );
}
