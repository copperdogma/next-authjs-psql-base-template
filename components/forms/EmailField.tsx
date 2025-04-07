'use client';

import { memo } from 'react';
import { EmailOutlined } from '@mui/icons-material';
import { FormField, FormFieldProps } from './FormField';

// Define EmailFieldProps by extending FormFieldProps and adding specific props
export interface EmailFieldProps extends Omit<FormFieldProps, 'type' | 'label'> {
  label?: string; // Make label optional here too
  autoComplete?: string; // Add specific prop
}

/**
 * Specialized FormField for email inputs.
 * Uses react-hook-form compatible props.
 */
const EmailField = ({
  label = 'Email',
  name = 'email',
  placeholder = 'your@email.com',
  helpText = 'Enter your valid email address',
  ...rest // Spread the rest of the props (including register, error, touched, autoComplete)
}: EmailFieldProps) => {
  return (
    <FormField
      // Pass down standard and custom props
      name={name}
      label={label}
      type="email"
      placeholder={placeholder}
      startAdornment={<EmailOutlined />}
      helpText={helpText}
      {...rest} // Pass down registered props, error, touched, autoComplete etc.
    />
  );
};

export default memo(EmailField);
