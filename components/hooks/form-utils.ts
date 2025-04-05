'use client';

import { Dispatch, SetStateAction } from 'react';
import { FormFieldValue, FormErrors, FieldChange, ValidationFn } from './form-types';

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

/**
 * Creates a submit handler function for forms
 *
 * @param config - Configuration for the submit handler
 * @returns Submit event handler function
 */
export function createSubmitHandler<T extends Record<string, FormFieldValue>>(
  config: SubmitHandlerConfig<T>
) {
  const { values, onSubmit, validateForm, setErrors, setTouched, setIsSubmitting } = config;

  return async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const touchedFields = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );

    setTouched(touchedFields);

    // Validate the form
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are validation errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Submit the form
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({
        ...prev,
        form: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
}
