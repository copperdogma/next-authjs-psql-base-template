'use client';

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

export type ValidationFn<T> = (values: T) => Partial<Record<keyof T, string>>;

export type FieldChange = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

// Extended error type that includes form-level errors
export type FormErrors<T> = Partial<Record<keyof T, string>> & { form?: string };

export interface UseFormResult<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: FieldChange) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T | 'form', error: string) => void;
  reset: () => void;
  setValues: (values: Partial<T>) => void;
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
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  validate?: ValidationFn<T>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    if (!validate) return {};
    return validate(values);
  }, [values, validate]);

  const handleChange = useCallback((e: FieldChange) => {
    const { name, value } = e.target;
    let fieldValue: any = value;
    
    // Handle checkbox inputs specifically
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      fieldValue = e.target.checked;
    }
    
    setValues((prevValues) => ({
      ...prevValues,
      [name]: fieldValue,
    }));
    
    // Clear error when field is changed
    if (errors[name as keyof T]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name as keyof T];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[field]) {
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    }
  }, [values, validate]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T | 'form', error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    setErrors(validationErrors);
    
    if (!hasErrors) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        if (error instanceof Error) {
          setErrors((prev) => ({ ...prev, form: error.message }));
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Mark all fields with errors as touched
      const touchedFields = Object.keys(validationErrors).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched((prev) => ({ ...prev, ...touchedFields }));
    }
  }, [values, onSubmit, validateForm]);

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
    setValues: (newValues: Partial<T>) => setValues(prev => ({ ...prev, ...newValues })),
  };
} 