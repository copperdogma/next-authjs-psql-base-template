'use client';

import React from 'react';
import { TextField } from '@mui/material';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FormValues } from '../hooks/useRegistrationForm';

interface ConfirmPasswordInputProps {
  register: UseFormRegister<FormValues>;
  error: FieldError | undefined;
  disabled: boolean;
}

export function ConfirmPasswordInput({ register, error, disabled }: ConfirmPasswordInputProps) {
  return (
    <TextField
      margin="normal"
      required
      fullWidth
      label="Confirm Password"
      type="password"
      id="confirmPassword"
      autoComplete="new-password"
      {...register('confirmPassword')}
      error={!!error}
      helperText={error?.message}
      disabled={disabled}
      suppressHydrationWarning
    />
  );
}
