'use client';

import { memo } from 'react';
import { LockOutlined } from '@mui/icons-material';
import { FormField, FormFieldProps } from './FormField';

export interface PasswordFieldProps extends Omit<FormFieldProps, 'type' | 'label'> {
  label?: string;
  autoComplete?: string;
}

/**
 * Specialized FormField for password inputs.
 * Uses react-hook-form compatible props.
 */
const PasswordField = ({
  label = 'Password',
  name = 'password',
  helpText = 'Password must be at least 8 characters',
  ...rest
}: PasswordFieldProps) => {
  return (
    <FormField
      name={name}
      label={label}
      type="password"
      startAdornment={<LockOutlined />}
      helpText={helpText}
      {...rest}
    />
  );
};

export default memo(PasswordField);
