'use client';

import { forwardRef } from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
} from '@mui/material';

/**
 * Extended button props with additional options specific to this template
 */
export type ButtonProps = MuiButtonProps & {
  /**
   * Whether to show a loading spinner
   */
  isLoading?: boolean;
  /**
   * Text to show when button is in loading state
   */
  loadingText?: string;
  /**
   * Position of the loading spinner
   * @default "start"
   */
  loadingPosition?: 'start' | 'end' | 'center';
  /**
   * Fixed width to prevent layout shift when loading
   */
  fixedWidth?: boolean;
};

/**
 * Enhanced button component that wraps Material UI Button
 *
 * Features:
 * - Loading states with spinner
 * - Fixed width option to prevent layout shift
 * - All standard Material UI Button props
 *
 * Usage example:
 * ```tsx
 * <Button
 *   variant="contained"
 *   isLoading={isSubmitting}
 *   loadingText="Saving..."
 *   onClick={handleSubmit}
 * >
 *   Save
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    isLoading,
    loadingText,
    loadingPosition = 'start',
    fixedWidth,
    disabled,
    startIcon,
    endIcon,
    sx,
    ...rest
  } = props;

  // Handle loading state display
  const content = isLoading && loadingText ? loadingText : children;

  // Determine loading spinner position
  const showLoadingSpinner = isLoading && (
    <CircularProgress size={20} color="inherit" sx={{ mx: 1 }} />
  );

  const startContent = loadingPosition === 'start' && isLoading ? showLoadingSpinner : startIcon;

  const endContent = loadingPosition === 'end' && isLoading ? showLoadingSpinner : endIcon;

  return (
    <MuiButton
      ref={ref}
      startIcon={loadingPosition !== 'center' ? startContent : undefined}
      endIcon={loadingPosition !== 'center' ? endContent : undefined}
      disabled={disabled || isLoading}
      sx={{
        ...(fixedWidth && { minWidth: '120px' }),
        ...sx,
      }}
      {...rest}
    >
      {loadingPosition === 'center' && isLoading ? (
        <>
          {showLoadingSpinner}
          {content}
        </>
      ) : (
        content
      )}
    </MuiButton>
  );
});

Button.displayName = 'Button';

export { Button };
