'use client';

import { DialogActions } from '@mui/material';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogFooterProps {
  actions: ReactNode;
}

export default function DialogFooter({ actions }: DialogFooterProps) {
  if (!actions) return null;

  return (
    <DialogActions
      className={cn('px-6 py-4 flex gap-2 border-t border-gray-100 dark:border-gray-800')}
    >
      {actions}
    </DialogActions>
  );
}
