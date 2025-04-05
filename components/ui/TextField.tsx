'use client';

import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  InputLabelProps,
  InputProps,
  FormHelperTextProps,
} from '@mui/material';
import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

export type TextFieldProps = MuiTextFieldProps & {
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
};

/**
 * Prepares Input Label props with proper styling
 */
const prepareInputLabelProps = (
  inputLabelProps?: Partial<InputLabelProps>
): Partial<InputLabelProps> => ({
  ...(inputLabelProps || {}),
  className: cn('text-muted', inputLabelProps?.className),
  shrink: true,
});

/**
 * Prepares Input props with proper styling
 */
const prepareInputProps = (inputProps?: Partial<InputProps>): Partial<InputProps> => ({
  ...(inputProps || {}),
  className: cn('bg-background border-foreground/20 rounded-md', inputProps?.className),
});

/**
 * Prepares Form Helper Text props with proper styling
 */
const prepareFormHelperTextProps = (
  formHelperTextProps?: Partial<FormHelperTextProps>
): Partial<FormHelperTextProps> => ({
  ...(formHelperTextProps || {}),
  className: cn('text-xs mt-1', formHelperTextProps?.className),
});

const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  ({ className = '', fullWidth = true, variant = 'outlined', size = 'medium', ...props }, ref) => {
    return (
      <MuiTextField
        {...props}
        ref={ref}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        className={cn(className, 'transition-all duration-200')}
        InputLabelProps={prepareInputLabelProps(props.InputLabelProps)}
        InputProps={prepareInputProps(props.InputProps)}
        FormHelperTextProps={prepareFormHelperTextProps(props.FormHelperTextProps)}
      />
    );
  }
);

TextField.displayName = 'TextField';

// Memoize to prevent unnecessary re-renders
export default memo(TextField);
