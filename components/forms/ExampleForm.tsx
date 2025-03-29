'use client';

import { memo } from 'react';
import { useForm, ValidationFn, FormFieldValue } from '../hooks/useForm';
import { Checkbox, FormControlLabel, Alert, Stack } from '@mui/material';
import { EmailOutlined, LockOutlined } from '@mui/icons-material';
import { Button } from '../ui/Button';
import { FormField } from './FormField';

// Make FormValues compatible with Record<string, FormFieldValue>
interface FormValues extends Record<string, FormFieldValue> {
  email: string;
  password: string;
  rememberMe: boolean;
}

const initialValues: FormValues = {
  email: '',
  password: '',
  rememberMe: false,
};

// Form validation function
const validate: ValidationFn<FormValues> = values => {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
};

interface ExampleFormProps {
  /**
   * Function to handle form submission
   * @param values The form values
   */
  onSubmit: (values: FormValues) => Promise<void>;
  /**
   * Text for the submit button
   * @default "Submit"
   */
  submitButtonText?: string;
}

/**
 * Example form component demonstrating form implementation with validation
 *
 * This component showcases:
 * - Form state management with custom hooks
 * - Field validation
 * - Accessibility features
 * - Material UI components
 * - The reusable FormField component
 */
const ExampleForm = ({ onSubmit, submitButtonText = 'Submit' }: ExampleFormProps) => {
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useForm<FormValues>(initialValues, onSubmit, validate);

  // Form-level error state for general errors not tied to a specific field
  const formError = errors.form || '';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <FormField
          name="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          touched={touched.email}
          placeholder="your@email.com"
          startAdornment={<EmailOutlined />}
          helpText="Enter your email address"
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          touched={touched.password}
          startAdornment={<LockOutlined />}
          helpText="Password must be at least 8 characters"
        />

        <FormControlLabel
          control={
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={values.rememberMe}
              onChange={handleChange}
              color="primary"
            />
          }
          label="Remember me"
        />

        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="contained"
          fullWidth
          data-testid="form-submit"
        >
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </Button>
      </Stack>
    </form>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ExampleForm);
