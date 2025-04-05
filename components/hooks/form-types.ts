'use client';

import { ChangeEvent, FormEvent } from 'react';

// Type for form field values
export type FormFieldValue = string | number | boolean | null | undefined;

// Extended error type that includes form-level errors
export type FormErrors<T> = Partial<Record<keyof T, string>> & { form?: string };

// Type for validation function
export type ValidationFn<T> = (values: T) => FormErrors<T>;

// Type for field change events
export type FieldChange = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

// Interface for useForm result
export interface UseFormResult<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: FieldChange) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldValue: (field: keyof T, value: FormFieldValue) => void;
  setFieldError: (field: keyof T | 'form', error: string) => void;
  reset: () => void;
  setValues: (values: Partial<T>) => void;
}
