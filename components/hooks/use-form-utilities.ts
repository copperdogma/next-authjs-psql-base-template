'use client';

import { Dispatch, SetStateAction, useCallback } from 'react';
import { FormFieldValue, FormErrors } from './form-types';

interface FormState<T> {
  initialValues: T;
  setValues: Dispatch<SetStateAction<T>>;
  setErrors: Dispatch<SetStateAction<FormErrors<T>>>;
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof T, boolean>>>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
}

interface FormUtilities<T> {
  setFieldValue: (field: keyof T, value: FormFieldValue) => void;
  setFieldError: (field: keyof T | 'form', error: string) => void;
  reset: () => void;
  setPartialValues: (newValues: Partial<T>) => void;
}

/**
 * Hook to create utility functions for form management
 *
 * @param formState - Object containing form state and setters
 * @returns Object containing utility functions
 */
export function useFormUtilities<T extends Record<string, FormFieldValue>>(
  formState: FormState<T>
): FormUtilities<T> {
  const { initialValues, setValues, setErrors, setTouched, setIsSubmitting } = formState;

  const setFieldValue = useCallback(
    (field: keyof T, value: FormFieldValue) => {
      setValues(prev => ({ ...prev, [field]: value }));
    },
    [setValues]
  );

  const setFieldError = useCallback(
    (field: keyof T | 'form', error: string) => {
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    [setErrors]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues, setValues, setErrors, setTouched, setIsSubmitting]);

  const setPartialValues = useCallback(
    (newValues: Partial<T>) => {
      setValues(prev => ({ ...prev, ...newValues }));
    },
    [setValues]
  );

  return {
    setFieldValue,
    setFieldError,
    reset,
    setPartialValues,
  };
}
