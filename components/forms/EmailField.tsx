'use client';

import { EmailOutlined } from '@mui/icons-material';
import { FormField } from './FormField';

interface EmailFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}

export default function EmailField({ value, onChange, onBlur, error, touched }: EmailFieldProps) {
  return (
    <FormField
      name="email"
      label="Email"
      type="email"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      touched={touched}
      placeholder="your@email.com"
      startAdornment={<EmailOutlined />}
      helpText="Enter your email address"
    />
  );
}
