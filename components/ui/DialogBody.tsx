'use client';

import { DialogContent } from '@mui/material';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogBodyProps {
  children: ReactNode;
}

export default function DialogBody({ children }: DialogBodyProps) {
  return (
    <DialogContent id="dialog-description" className={cn('px-6 py-4')}>
      {children}
    </DialogContent>
  );
}
