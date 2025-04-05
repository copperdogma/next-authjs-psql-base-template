'use client';

import { memo } from 'react';
import { useForm, ValidationFn, FormFieldValue } from '../hooks/useForm';
import { Stack } from '@mui/material';
import EmailField from './EmailField';
import PasswordField from './PasswordField';
import RememberMeCheckbox from './RememberMeCheckbox';
import FormErrorAlert from './FormErrorAlert';
import SubmitButton from './SubmitButton';

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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <EmailField
          value={values.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          touched={touched.email}
        />

        <PasswordField
          value={values.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          touched={touched.password}
        />

        <RememberMeCheckbox checked={values.rememberMe} onChange={handleChange} />

        <FormErrorAlert error={errors.form || ''} />

        <SubmitButton isSubmitting={isSubmitting} text={submitButtonText} />
      </Stack>
    </form>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ExampleForm);
