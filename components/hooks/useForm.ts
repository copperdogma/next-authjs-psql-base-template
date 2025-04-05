'use client';

import { useState } from 'react';
import { FormFieldValue, UseFormResult, ValidationFn, FormErrors } from './form-types';
import { useFormUtilities } from './use-form-utilities';
import { useFormHandlers } from './use-form-handlers';

/**
 * Custom hook for managing form state with validation
 *
 * @param initialValues - Initial form values
 * @param onSubmit - Function to call on form submission after validation passes
 * @param validate - Optional validation function
 * @returns Form state and handlers
 *
 * @example
 * const { values, errors, handleChange, handleSubmit } = useForm(
 *   { email: '', password: '' },
 *   async (values) => {
 *     await loginUser(values);
 *   },
 *   (values) => {
 *     const errors: Record<string, string> = {};
 *     if (!values.email) errors.email = 'Required';
 *     if (!values.password) errors.password = 'Required';
 *     return errors;
 *   }
 * );
 */
export function useForm<T extends Record<string, FormFieldValue>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  validate?: ValidationFn<T>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get handlers for form events
  const { handleChange, handleBlur, handleSubmit } = useFormHandlers({
    values,
    errors,
    setValues,
    setErrors,
    setTouched,
    setIsSubmitting,
    onSubmit,
    validate,
  });

  // Get utility functions
  const { setFieldValue, setFieldError, reset, setPartialValues } = useFormUtilities({
    initialValues,
    setValues,
    setErrors,
    setTouched,
    setIsSubmitting,
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
    setValues: setPartialValues,
  };
}
