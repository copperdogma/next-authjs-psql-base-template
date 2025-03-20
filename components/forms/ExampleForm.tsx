'use client';

import { memo } from 'react';
import { useForm, ValidationFn } from '../hooks/useForm';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface FormValues {
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
const validate: ValidationFn<FormValues> = (values) => {
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
  onSubmit: (values: FormValues) => Promise<void>;
  submitButtonText?: string;
}

const ExampleForm = ({ onSubmit, submitButtonText = 'Submit' }: ExampleFormProps) => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
  } = useForm<FormValues>(initialValues, onSubmit, validate);

  // Form-level error state for general errors not tied to a specific field
  const formError = errors.form || '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          className={errors.email && touched.email ? 'border-red-500' : ''}
          placeholder="your@email.com"
          aria-invalid={Boolean(errors.email && touched.email)}
          aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
        />
        {errors.email && touched.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          className={errors.password && touched.password ? 'border-red-500' : ''}
          aria-invalid={Boolean(errors.password && touched.password)}
          aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
        />
        {errors.password && touched.password && (
          <p id="password-error" className="mt-1 text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          checked={values.rememberMe}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="rememberMe" className="ml-2 block text-sm">
          Remember me
        </label>
      </div>

      {formError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          {formError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        data-testid="form-submit"
      >
        {isSubmitting ? 'Submitting...' : submitButtonText}
      </Button>
    </form>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ExampleForm); 