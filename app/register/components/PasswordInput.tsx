'use client';

import React from 'react';
import { TextField } from '@mui/material';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FormValues } from '../hooks/useRegistrationForm';

interface PasswordInputProps {
  register: UseFormRegister<FormValues>;
  error: FieldError | undefined;
  disabled: boolean;
}

export function PasswordInput({ register, error, disabled }: PasswordInputProps) {
  return (
    <TextField
      margin="normal"
      required
      fullWidth
      label="Password"
      type="password"
      id="password"
      autoComplete="new-password"
      {...register('password')}
      error={!!error}
      helperText={error?.message}
      disabled={disabled}
      suppressHydrationWarning
    />
  );
}
