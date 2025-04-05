'use client';

import { DialogTitle, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogHeaderProps {
  title?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function DialogHeader({ title, showCloseButton, onClose }: DialogHeaderProps) {
  if (!title && !showCloseButton) return null;

  return (
    <DialogTitle id="dialog-title" className={cn('flex items-center justify-between py-4 px-6')}>
      <div className={cn('text-xl font-semibold')}>{title}</div>
      {showCloseButton && onClose && (
        <IconButton
          aria-label="close dialog"
          onClick={onClose}
          size="small"
          className={cn(
            'absolute right-3 top-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100',
            'dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-full transition-colors'
          )}
          edge="end"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
  );
}
