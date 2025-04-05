'use client';

import { ChangeEvent, FormEvent } from 'react';

export type ValidationFn<T> = (values: T) => Partial<Record<keyof T, string>>;

export type FieldChange = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

// Extended error type that includes form-level errors
export type FormErrors<T> = Partial<Record<keyof T, string>> & { form?: string };

// Type for form field values
export type FormFieldValue = string | number | boolean | null | undefined;

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
