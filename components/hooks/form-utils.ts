'use client';

import { Dispatch, SetStateAction } from 'react';
import { FormFieldValue, FormErrors, FieldChange, ValidationFn } from './form-types';
import { clientLogger } from '@/lib/client-logger';

/**
 * Validates form values using the provided validation function
 *
 * @param values - Current form values
 * @param validate - Optional validation function
 * @returns Object containing validation errors
 */
export function validateFormValues<T extends Record<string, FormFieldValue>>(
  values: T,
  validate?: ValidationFn<T>
): FormErrors<T> {
  if (!validate) return {};
  return validate(values);
}

/**
 * Creates a change handler function for form inputs
 *
 * @param setValues - State setter for form values
 * @param errors - Current form errors
 * @param setErrors - State setter for form errors
 * @returns Change event handler function
 */
export function createChangeHandler<T extends Record<string, FormFieldValue>>(
  setValues: Dispatch<SetStateAction<T>>,
  errors: FormErrors<T>,
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>
) {
  return (e: FieldChange) => {
    const { name, value, type } = e.target;
    let fieldValue: FormFieldValue = value;

    // Handle checkbox inputs specifically
    if (e.target instanceof HTMLInputElement && type === 'checkbox') {
      fieldValue = e.target.checked;
    }

    setValues(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear field error when value changes
    if (errors[name as keyof T]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof T];
        return newErrors;
      });
    }
  };
}

/**
 * Creates a blur handler function for form inputs
 *
 * @param setTouched - State setter for touched fields
 * @param values - Current form values
 * @param setErrors - State setter for form errors
 * @param validate - Optional validation function
 * @returns Blur event handler function
 */
export function createBlurHandler<T extends Record<string, FormFieldValue>>(
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof T, boolean>>>>,
  values: T,
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>,
  validate?: ValidationFn<T>
) {
  return (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    if (validate) {
      const validationErrors = validateFormValues(values, validate);
      if (validationErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
      }
    }
  };
}

interface FormUtilitiesConfig<T> {
  initialValues: T;
  setValues: Dispatch<SetStateAction<T>>;
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>;
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof T, boolean>>>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
}

/**
 * Creates form utility functions
 *
 * @param config - Configuration object for form utilities
 * @returns Object containing utility functions
 */
export function createFormUtilities<T extends Record<string, FormFieldValue>>(
  config: FormUtilitiesConfig<T>
) {
  const { initialValues, setValues, setErrors, setTouched, setIsSubmitting } = config;

  const setFieldValue = (field: keyof T, value: FormFieldValue) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const setFieldError = (field: keyof T | 'form', error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const setPartialValues = (newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  };

  return {
    setFieldValue,
    setFieldError,
    reset,
    setPartialValues,
  };
}

interface SubmitHandlerConfig<T> {
  values: T;
  onSubmit: (values: T) => Promise<void>;
  validateForm: () => FormErrors<T>;
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>;
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof T, boolean>>>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
}

// Helper function to handle form submission errors
function handleSubmissionError<T extends Record<string, unknown>>(
  error: unknown,
  values: T,
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>
) {
  let errorMessage = 'An unexpected error occurred.';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  setErrors(prev => ({ ...prev, form: errorMessage }));

  // Log the error to the server
  clientLogger.error('Form submission failed', {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    formValues: values, // Be mindful of logging sensitive data here
  });
}

/**
 * Creates a submit handler function for forms
 *
 * @param config - Configuration for the submit handler
 * @returns Submit event handler function
 */
export function createSubmitHandler<T extends Record<string, FormFieldValue>>(
  config: SubmitHandlerConfig<T>
) {
  const { values, onSubmit, validateForm, setErrors, setIsSubmitting } = config;

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    // Validate all fields before submitting
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false); // Ensure isSubmitting is false if validation fails
      return; // Stop submission if validation fails
    }

    // Clear any previous errors before attempting submission
    setErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      // Clear form-level error on success
      setErrors(prev => ({ ...prev, form: undefined }));
    } catch (error) {
      handleSubmissionError(error, values, setErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return handleSubmit;
}
