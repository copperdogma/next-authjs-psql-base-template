'use client';

import React from 'react';
import { TextField } from '@mui/material';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FormValues } from '../hooks/useRegistrationForm'; // Import FormValues again

interface EmailInputProps {
  register: UseFormRegister<FormValues>; // Add register prop back
  error: FieldError | undefined;
  disabled: boolean;
}

// Revert to simple function component
export function EmailInput({ register, error, disabled }: EmailInputProps) {
  return (
    <TextField
      margin="normal"
      required
      fullWidth
      id="email"
      label="Email Address"
      autoComplete="email"
      autoFocus // Add the autoFocus attribute here
      {...register('email')}
      error={!!error}
      helperText={error?.message}
      disabled={disabled}
      suppressHydrationWarning
    />
  );
}
