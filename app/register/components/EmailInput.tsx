'use client';

import React from 'react';
import { TextField } from '@mui/material';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FormValues } from '../hooks/useRegistrationForm'; // Corrected import path

interface EmailInputProps {
  register: UseFormRegister<FormValues>;
  error: FieldError | undefined;
  disabled: boolean;
}

export function EmailInput({ register, error, disabled }: EmailInputProps) {
  return (
    <TextField
      margin="normal"
      required
      fullWidth
      id="email"
      label="Email Address"
      autoComplete="email"
      {...register('email')}
      error={!!error}
      helperText={error?.message}
      disabled={disabled}
      suppressHydrationWarning
    />
  );
}
