'use client';

import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import { forwardRef, memo } from 'react';

export type TextFieldProps = MuiTextFieldProps & {
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
};

const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  ({ 
    className = '', 
    fullWidth = true, 
    variant = 'outlined',
    size = 'medium',
    ...props 
  }, ref) => {
    return (
      <MuiTextField
        {...props}
        ref={ref}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        className={`${className} transition-all duration-200`}
        InputLabelProps={{
          ...(props.InputLabelProps || {}),
          className: `text-muted ${props.InputLabelProps?.className || ''}`,
          shrink: true,
        }}
        InputProps={{
          ...(props.InputProps || {}),
          className: `bg-background border-foreground/20 rounded-md ${props.InputProps?.className || ''}`,
        }}
        FormHelperTextProps={{
          ...(props.FormHelperTextProps || {}),
          className: `text-xs mt-1 ${props.FormHelperTextProps?.className || ''}`,
        }}
      />
    );
  }
);

TextField.displayName = 'TextField';

// Memoize to prevent unnecessary re-renders
export default memo(TextField); 