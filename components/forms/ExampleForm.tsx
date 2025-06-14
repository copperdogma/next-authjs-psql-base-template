'use client';

import { memo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stack } from '@mui/material';
import EmailField from './EmailField';
import PasswordField from './PasswordField';
import RememberMeCheckbox from './RememberMeCheckbox';
import FormErrorAlert from './FormErrorAlert';
import SubmitButton from './SubmitButton';

// Define the Zod schema for form validation
const formSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean(),
});

// Infer the TypeScript type from the schema
type FormValues = z.infer<typeof formSchema>;

// Define props for the ExampleForm component
interface ExampleFormProps {
  onSubmit: SubmitHandler<FormValues>; // Use SubmitHandler from react-hook-form
  submitButtonText?: string;
  initialValues?: Partial<FormValues>; // Allow passing initial values
}

/**
 * Example form component demonstrating react-hook-form and Zod validation
 * using the custom form field components (EmailField, PasswordField, etc.).
 *
 * While the fields in this example (email, password, rememberMe) are typical
 * for a login scenario, this form serves as a general template for building
 * various types of forms within the application.
 *
 * Key features demonstrated:
 * - React Hook Form integration
 * - Zod schema validation
 * - Error handling and display
 * - Form state management
 * - Initial values
 * - Submission handling
 */
const ExampleForm = ({
  onSubmit,
  submitButtonText = 'Submit',
  initialValues,
}: ExampleFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Integrate Zod validation
    defaultValues: {
      email: initialValues?.email || '',
      password: initialValues?.password || '',
      rememberMe: initialValues?.rememberMe || false,
    },
  });

  // Centralized error handling (optional, good for API errors)
  const formError = errors.root?.message; // Access root errors if set by setError('root', ...)
  // Developer Note: When calling setError('root', { message: '...' }) in the onSubmit handler,
  // ensure the provided message is user-friendly or pre-processed (e.g., using getDisplayErrorMessage)
  // if it originates from a raw error object, to prevent leaking technical details in production.

  return (
    // Use react-hook-form's handleSubmit to wrap our onSubmit
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        <EmailField
          // Register email field with react-hook-form
          {...register('email')}
          // Pass error message and touched status
          error={errors.email?.message}
          touched={touchedFields.email}
          // AutoComplete attribute for accessibility/UX
          autoComplete="email"
        />

        <PasswordField
          // Register password field
          {...register('password')}
          error={errors.password?.message}
          touched={touchedFields.password}
          autoComplete="current-password"
        />

        <RememberMeCheckbox
          // Register checkbox field
          {...register('rememberMe')}
          // Note: For complex components (like MUI Checkbox), using <Controller> might be better
          // to handle value/onChange mapping, but direct register works for simple cases.
          // checked={values.rememberMe} // react-hook-form handles checked state via register
          // onChange={handleChange} // react-hook-form handles change via register
          label="Remember Me" // Add a label for clarity
        />

        {/* Display root form errors (e.g., from API response) */}
        <FormErrorAlert error={formError || ''} />

        {/* Pass submitting state to the button */}
        <SubmitButton isSubmitting={isSubmitting} text={submitButtonText} />
      </Stack>
    </form>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ExampleForm);
