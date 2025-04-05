'use client';

import { Dispatch, SetStateAction } from 'react';
import { FieldChange, FormFieldValue, FormErrors, ValidationFn } from './form-types';
import { validateFormValues } from './form-validation';

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
