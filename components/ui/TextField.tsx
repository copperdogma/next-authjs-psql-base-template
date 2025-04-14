'use client';

import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  styled,
} from '@mui/material';
import { forwardRef, memo } from 'react';

export type TextFieldProps = MuiTextFieldProps & {
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
};

// Styled TextField component
const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  // Add transition styles if needed
  transition: theme.transitions.create(['border-color', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),

  // Use sx prop for specific overrides or use styled component approach for general styles
  // Example of styling the input directly:
  '& .MuiInputBase-root': {
    backgroundColor: theme.palette.background.paper, // Example: Use paper background
    borderRadius: theme.shape.borderRadius,
    // Add other base input styles here
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.text.primary,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  // Example: Styling the label
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary, // Example: muted color for label
    // Ensure shrink works correctly
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  // Example: Styling the helper text
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem', // text-xs
    marginTop: theme.spacing(0.5), // mt-1 (assuming theme.spacing(1) is 8px)
    // Add other helper text styles
  },
}));

const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  (
    {
      fullWidth = true,
      variant = 'outlined',
      size = 'medium',
      InputLabelProps,
      InputProps,
      FormHelperTextProps,
      ...props
    },
    ref
  ) => {
    // Pass merged props to the styled component
    // Specific instance styles can still be passed via sx prop on the component usage
    return (
      <StyledTextField
        {...props}
        ref={ref}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        // Ensure shrink: true is applied to label props if provided
        InputLabelProps={{ ...(InputLabelProps || {}), shrink: true }}
        InputProps={InputProps}
        FormHelperTextProps={FormHelperTextProps}
      />
    );
  }
);

TextField.displayName = 'TextField';

// Memoize to prevent unnecessary re-renders
export default memo(TextField);
