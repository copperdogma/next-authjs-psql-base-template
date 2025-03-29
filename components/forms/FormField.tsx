'use client';

import { ReactNode } from 'react';
import { TextField, TextFieldProps, InputAdornment, Tooltip } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';

/**
 * Props for the FormField component
 */
export interface FormFieldProps extends Omit<TextFieldProps, 'error'> {
  /**
   * Field name (used for form state)
   */
  name: string;
  /**
   * Field label
   */
  label: string;
  /**
   * Error message to display
   */
  error?: string | null;
  /**
   * Whether the field has been touched/visited
   */
  touched?: boolean;
  /**
   * Help text to show in a tooltip
   */
  helpText?: string;
  /**
   * Start adornment component
   */
  startAdornment?: ReactNode;
  /**
   * End adornment component
   */
  endAdornment?: ReactNode;
}

/**
 * A standardized form field component that wraps Material UI TextField
 *
 * Features:
 * - Consistent styling and behavior
 * - Built-in error handling
 * - Optional help text tooltip
 * - Support for input adornments
 */
export function FormField({
  name,
  label,
  error,
  touched,
  helpText,
  startAdornment,
  endAdornment,
  InputProps,
  ...props
}: FormFieldProps) {
  // Only show errors if the field has been touched
  const showError = Boolean(error && touched);

  // Merge any existing InputProps with our adornments
  const mergedInputProps = {
    ...InputProps,
    ...(startAdornment
      ? {
          startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>,
        }
      : {}),
    ...(endAdornment || helpText
      ? {
          endAdornment: (
            <InputAdornment position="end">
              {endAdornment}
              {helpText && (
                <Tooltip title={helpText} arrow>
                  <HelpIcon color="action" fontSize="small" sx={{ ml: 0.5 }} />
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }
      : {}),
  };

  return (
    <TextField
      id={name}
      name={name}
      label={label}
      error={showError}
      helperText={showError ? error : props.helperText}
      fullWidth
      InputProps={mergedInputProps}
      {...props}
    />
  );
}
