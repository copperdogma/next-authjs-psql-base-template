'use client';

import { memo, useState } from 'react';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { FormField, FormFieldProps } from './FormField';

export interface PasswordFieldProps extends Omit<FormFieldProps, 'type' | 'label'> {
  label?: string;
  autoComplete?: string;
  showToggle?: boolean;
}

/**
 * Specialized FormField for password inputs.
 * Uses react-hook-form compatible props.
 *
 * Features:
 * - Password visibility toggle
 * - Pre-configured with lock icon
 * - Appropriate default label and help text
 */
const PasswordField = ({
  label = 'Password',
  name = 'password',
  helpText = 'Password must be at least 8 characters',
  showToggle = true,
  ...rest
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <FormField
      name={name}
      label={label}
      type={showPassword ? 'text' : 'password'}
      startAdornment={<LockOutlined />}
      endAdornment={
        showToggle ? (
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleToggleVisibility}
            onMouseDown={event => event.preventDefault()} // Prevents focus loss on click
            edge="end"
            size="small"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        ) : undefined
      }
      helpText={helpText}
      {...rest}
    />
  );
};

export default memo(PasswordField);
