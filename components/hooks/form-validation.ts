'use client';

import { FormFieldValue, ValidationFn, FormErrors } from './form-types';

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
 * Creates a map of touched fields for all fields with validation errors
 * @param validationErrors Validation errors from form validation
 * @returns Object with fields marked as touched
 */
export function createTouchedFieldsFromErrors<T>(
  validationErrors: Partial<Record<keyof T, string>>
): Partial<Record<keyof T, boolean>> {
  return Object.keys(validationErrors).reduce<Partial<Record<keyof T, boolean>>>(
    (acc, key) => ({ ...acc, [key]: true }),
    {}
  );
}
