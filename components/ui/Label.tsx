'use client';

import { forwardRef } from 'react';
import { InputLabel as MuiInputLabel, InputLabelProps as MuiInputLabelProps } from '@mui/material';

export interface LabelProps extends Omit<MuiInputLabelProps, 'variant'> {
  variant?: 'default' | 'error' | 'success';
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(({ variant, sx, ...props }, ref) => {
  const color = variant === 'error' ? 'error' : variant === 'success' ? 'success' : 'inherit';

  return (
    <MuiInputLabel
      ref={ref}
      sx={{
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: '1',
        color: `${color}.main`,
        ...(sx || {}),
      }}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label };
