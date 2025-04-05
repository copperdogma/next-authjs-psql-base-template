'use client';

import { forwardRef } from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
} from '@mui/material';

/**
 * Renders a loading spinner
 */
const LoadingSpinner = () => <CircularProgress size={20} color="inherit" sx={{ mx: 1 }} />;

/**
 * Determines the icon to show at the start position
 */
const getStartIcon = (loadingPosition: string, isLoading: boolean, startIcon: React.ReactNode) => {
  if (loadingPosition === 'center') {
    return undefined;
  }

  return loadingPosition === 'start' && isLoading ? <LoadingSpinner /> : startIcon;
};

/**
 * Determines the icon to show at the end position
 */
const getEndIcon = (loadingPosition: string, isLoading: boolean, endIcon: React.ReactNode) => {
  if (loadingPosition === 'center') {
    return undefined;
  }

  return loadingPosition === 'end' && isLoading ? <LoadingSpinner /> : endIcon;
};

/**
 * Renders the button content based on loading state and position
 */
const renderButtonContent = (
  loadingPosition: string,
  isLoading: boolean,
  content: React.ReactNode
) => {
  if (loadingPosition === 'center' && isLoading) {
    return (
      <>
        <LoadingSpinner />
        {content}
      </>
    );
  }

  return content;
};

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

  // Get icons based on loading position
  const startContent = getStartIcon(loadingPosition, !!isLoading, startIcon);
  const endContent = getEndIcon(loadingPosition, !!isLoading, endIcon);

  return (
    <MuiButton
      ref={ref}
      startIcon={startContent}
      endIcon={endContent}
      disabled={disabled || isLoading}
      sx={{
        ...(fixedWidth && { minWidth: '120px' }),
        ...sx,
      }}
      {...rest}
    >
      {renderButtonContent(loadingPosition, !!isLoading, content)}
    </MuiButton>
  );
});

Button.displayName = 'Button';

export { Button };
