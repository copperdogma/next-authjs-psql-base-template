'use client';

import React from 'react';
import { useForm, Controller, Control, FieldValues, Path } from 'react-hook-form';
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

// Helper component props type
interface FormTextFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

// Helper component for controlled text fields
const FormTextField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  type = 'text',
  autoComplete,
  required = false,
  disabled = false,
}: FormTextFieldProps<TFieldValues>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        {...field}
        margin="normal"
        required={required}
        fullWidth
        id={name}
        label={label}
        type={type}
        autoComplete={autoComplete}
        error={!!error}
        helperText={error?.message}
        disabled={disabled}
        suppressHydrationWarning
      />
    )}
  />
);

// Infer the type from the schema
type LoginFormData = z.infer<typeof LoginSchema>;

// Custom Hook for LoginForm logic
const useLoginForm = (
  onSubmit: (data: LoginFormData) => Promise<void>,
  isSubmittingProp?: boolean
) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const submitting = isSubmittingProp || form.formState.isSubmitting;

  const handleFormSubmit = form.handleSubmit(async data => {
    await onSubmit(data);
  });

  return { form, submitting, handleFormSubmit };
};

// Add this new component
const SignUpLink = () => (
  <Grid container justifyContent="flex-end">
    <Grid>
      <Link href="/register">
        <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
          {"Don't have an account? Sign Up"}
        </Typography>
      </Link>
    </Grid>
  </Grid>
);

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  errorMessage?: string | null;
  isSubmitting?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, errorMessage, isSubmitting }) => {
  // Use the custom hook
  const { form, submitting, handleFormSubmit } = useLoginForm(onSubmit, isSubmitting);

  return (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      noValidate
      sx={{ mt: 1 }}
      suppressHydrationWarning
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <FormTextField<LoginFormData>
            name="email"
            control={form.control}
            label="Email Address"
            required
            autoComplete="email"
            disabled={submitting}
          />
        </Grid>
        <Grid size={12}>
          <FormTextField<LoginFormData>
            name="password"
            control={form.control}
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            disabled={submitting}
          />
        </Grid>
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
      <SignUpLink />
    </Box>
  );
};

export default LoginForm;
