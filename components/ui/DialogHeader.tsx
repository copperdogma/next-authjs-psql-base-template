'use client';

import { DialogTitle, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

interface DialogHeaderProps {
  title?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function DialogHeader({ title, showCloseButton, onClose }: DialogHeaderProps) {
  if (!title && !showCloseButton) return null;

  return (
    <DialogTitle
      id="dialog-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        px: 3,
        position: 'relative',
      }}
    >
      <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {showCloseButton && onClose && (
        <IconButton
          aria-label="close dialog"
          onClick={onClose}
          size="small"
          edge="end"
          sx={{
            position: 'absolute',
            right: theme => theme.spacing(1.5),
            top: theme => theme.spacing(1.5),
            color: 'text.secondary',
            transition: theme => theme.transitions.create(['color', 'background-color']),
            '&:hover': {
              color: 'text.primary',
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? 'action.hover' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
  );
}
