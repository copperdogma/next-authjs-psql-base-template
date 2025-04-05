'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { FormFieldValue, FormErrors } from './form-types';

interface SubmitHandlerDependencies<T> {
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
 * @param deps - Dependencies needed for form submission
 * @returns Submit event handler function
 */
export function createSubmitHandler<T extends Record<string, FormFieldValue>>(
  deps: SubmitHandlerDependencies<T>
) {
  const { values, onSubmit, validateForm, setErrors, setTouched, setIsSubmitting } = deps;

  return async (e: FormEvent<HTMLFormElement>) => {
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
