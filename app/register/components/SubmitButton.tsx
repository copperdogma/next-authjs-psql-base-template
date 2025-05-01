'use client';

import React from 'react';
import { Button } from '@mui/material';

interface SubmitButtonProps {
  isPending: boolean;
}

export function SubmitButton({ isPending }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      variant="contained"
      sx={{ mt: 3, mb: 2, width: '100%' }}
    >
      {isPending ? 'Registering...' : 'Register'}
    </Button>
  );
}
