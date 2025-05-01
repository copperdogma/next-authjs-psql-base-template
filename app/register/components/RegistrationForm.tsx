'use client';

import React from 'react';
import { Box, Alert } from '@mui/material';

// Import the hook and sub-components
import { useRegistrationForm } from '../hooks/useRegistrationForm';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { ConfirmPasswordInput } from './ConfirmPasswordInput';
import { SubmitButton } from './SubmitButton';

// FormValues type is now defined in the hook file
// export type FormValues = z.infer<typeof formSchema>; // Removed

// The main component becomes much simpler, focusing only on rendering
export function RegistrationForm() {
  // Get all logic and state from the custom hook
  const { form, onSubmit, isPending, error, success } = useRegistrationForm();

  return (
    <Box
      component="form"
      onSubmit={form.handleSubmit(onSubmit)}
      sx={{ mt: 1 }}
      suppressHydrationWarning
    >
      <EmailInput
        register={form.register}
        error={form.formState.errors.email}
        disabled={isPending}
      />
      <PasswordInput
        register={form.register}
        error={form.formState.errors.password}
        disabled={isPending}
      />
      <ConfirmPasswordInput
        register={form.register}
        error={form.formState.errors.confirmPassword}
        disabled={isPending}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      <SubmitButton isPending={isPending} />
    </Box>
  );
}

export default RegistrationForm;
