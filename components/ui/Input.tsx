'use client';

import { forwardRef, memo } from 'react';
import { Input as MuiInput, InputProps as MuiInputProps, styled } from '@mui/material';

// Define interface extending MUI InputProps
export interface InputProps extends MuiInputProps {
  // Add custom variant props if needed, otherwise rely on MUI variants (filled, outlined, standard)
}

// Use MUI styled API to create styled input
const StyledInput = styled(MuiInput)<InputProps>(({ theme, size }) => ({
  // Base styles (approximating CVA defaults)
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`, // default border
  backgroundColor: theme.palette.background.paper,
  fontSize: theme.typography.pxToRem(14), // text-sm
  paddingLeft: theme.spacing(1.5), // px-3 approx
  paddingRight: theme.spacing(1.5),
  // height and vertical padding based on size prop ('small' or 'medium')
  height: size === 'small' ? '32px' : '40px', // Default to medium height
  paddingTop: size === 'small' ? theme.spacing(1) : theme.spacing(1.25), // Default to medium padding
  paddingBottom: size === 'small' ? theme.spacing(1) : theme.spacing(1.25), // Default to medium padding

  // Ring effect on focus (using outline for better accessibility)
  '&.Mui-focused': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
    borderColor: 'transparent', // Hide default border on focus
  },
  '&.Mui-disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  // Placeholder styles
  '& ::placeholder': {
    color: theme.palette.text.secondary,
  },
  // File input styles (MUI handles this differently, usually with a Button)
  // These might need a different approach if file input is used
}));

// ForwardRef component using the styled input
const Input = forwardRef<HTMLInputElement, InputProps>(({ type, ...props }, ref) => {
  return (
    <StyledInput
      type={type}
      ref={ref}
      disableUnderline // Use this if you want to remove the default MUI underline
      {...props}
    />
  );
});
Input.displayName = 'Input';

// Memoize the Input component to prevent unnecessary re-renders
export const MemoInput = memo(Input);
export { Input };
