'use client';

import { useState, useCallback } from 'react';
import { FormFieldValue, UseFormResult, ValidationFn, FormErrors } from './form-types';
import {
  validateFormValues,
  createChangeHandler,
  createBlurHandler,
  createSubmitHandler,
  createFormUtilities,
} from './form-utils';

// Split the hook into smaller parts to meet line count requirements
function useFormValidation<T extends Record<string, FormFieldValue>>(
  values: T,
  validate?: ValidationFn<T>
) {
  return useCallback(() => validateFormValues(values, validate), [values, validate]);
}

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
  // Define all state in one place at the top level
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a validateForm function that validates the current values
  const validateForm = useFormValidation(values, validate);

  // Create handlers
  const handleChange = useCallback(createChangeHandler(setValues, errors, setErrors), [errors]);

  const handleBlur = useCallback(createBlurHandler(setTouched, values, setErrors, validate), [
    values,
    validate,
    setTouched,
    setErrors,
  ]);

  const handleSubmit = useCallback(
    createSubmitHandler({
      values,
      onSubmit,
      validateForm,
      setErrors,
      setTouched,
      setIsSubmitting,
    }),
    [values, onSubmit, validateForm]
  );

  // Create utility functions
  const { setFieldValue, setFieldError, reset, setPartialValues } = createFormUtilities({
    initialValues,
    setValues,
    setErrors,
    setTouched,
    setIsSubmitting,
  });

  // Return form state and handlers
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
