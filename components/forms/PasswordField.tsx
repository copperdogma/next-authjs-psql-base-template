'use client';

import { LockOutlined } from '@mui/icons-material';
import { FormField } from './FormField';

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}

export default function PasswordField({
  value,
  onChange,
  onBlur,
  error,
  touched,
}: PasswordFieldProps) {
  return (
    <FormField
      name="password"
      label="Password"
      type="password"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      touched={touched}
      startAdornment={<LockOutlined />}
      helpText="Password must be at least 8 characters"
    />
  );
}
