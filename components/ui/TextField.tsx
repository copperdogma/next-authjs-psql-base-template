'use client';

import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

interface TextFieldProps extends MuiTextFieldProps {
  fullWidth?: boolean;
}

const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  ({ className = '', fullWidth = true, ...props }, ref) => {
    return (
      <MuiTextField
        {...props}
        ref={ref}
        fullWidth={fullWidth}
        className={`${className} min-w-[120px]`}
        variant="outlined"
        InputLabelProps={{
          ...props.InputLabelProps,
          className: 'text-foreground',
        }}
        InputProps={{
          ...props.InputProps,
          className: `bg-background border-foreground/20 ${props.InputProps?.className || ''}`,
        }}
      />
    );
  }
);

TextField.displayName = 'TextField';

export default TextField; 