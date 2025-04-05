'use client';

import { useCallback } from 'react';
import { FormFieldValue, FormErrors, ValidationFn, FieldChange } from './form-types';
import { validateFormValues } from './form-validation';
import { createChangeHandler, createBlurHandler } from './form-handlers';
import { createSubmitHandler } from './form-submission';

interface FormHandlerDependencies<T> {
  values: T;
  errors: FormErrors<T>;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors<T>>>;
  setTouched: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, boolean>>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (values: T) => Promise<void>;
  validate?: ValidationFn<T>;
}

interface FormHandlers<T> {
  handleChange: (e: FieldChange) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Hook to create form event handlers
 *
 * @param deps - Dependencies for form handlers
 * @returns Object containing event handlers
 */
export function useFormHandlers<T extends Record<string, FormFieldValue>>(
  deps: FormHandlerDependencies<T>
): FormHandlers<T> {
  const { values, errors, setValues, setErrors, setTouched, setIsSubmitting, onSubmit, validate } =
    deps;

  // Create a validateForm function that validates the current values
  const validateForm = useCallback(() => {
    return validateFormValues(values, validate);
  }, [values, validate]);

  // Create handlers
  const handleChange = useCallback(createChangeHandler(setValues, errors, setErrors), [
    errors,
    setValues,
    setErrors,
  ]);

  const handleBlur = useCallback(createBlurHandler(setTouched, values, setErrors, validate), [
    setTouched,
    values,
    setErrors,
    validate,
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
    [values, onSubmit, validateForm, setErrors, setTouched, setIsSubmitting]
  );

  return {
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
