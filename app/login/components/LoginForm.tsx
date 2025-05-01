'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

// Define the validation schema
const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// Infer the type from the schema
type LoginFormData = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  errorMessage?: string | null;
  isSubmitting?: boolean; // Allow parent to control submission state if needed
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  errorMessage,
  isSubmitting = false, // Default to internal state if not provided
}) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Use internal submitting state if parent doesn't provide one
  const submitting = isSubmitting || form.formState.isSubmitting;

  // Wrapper for the onSubmit prop provided by the parent
  const handleFormSubmit = form.handleSubmit(async data => {
    await onSubmit(data);
  });

  return (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      noValidate
      sx={{ mt: 1 }}
      suppressHydrationWarning
    >
      <Grid container spacing={2}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              error={!!error}
              helperText={error?.message}
              disabled={submitting}
              suppressHydrationWarning
            />
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!error}
              helperText={error?.message}
              disabled={submitting}
              suppressHydrationWarning
            />
          )}
        />
      </Grid>

      {errorMessage && (
        <Typography color="error" variant="body2" align="center" sx={{ mt: 2, mb: 1 }}>
          {errorMessage}
        </Typography>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={submitting}
      >
        {submitting ? 'Signing In...' : 'Sign In'}
      </Button>

      <Grid container justifyContent="flex-end">
        <Grid>
          <Link href="/register">
            <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
              {"Don't have an account? Sign Up"}
            </Typography>
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginForm;
