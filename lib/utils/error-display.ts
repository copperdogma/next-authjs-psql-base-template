/**
 * Determines the error message to display based on the environment.
 * In production, a generic message is returned.
 * In development, the actual error message is returned if available, otherwise its string representation or a fallback generic message.
 *
 * @param error The error object.
 * @param genericMessage The generic message to display in production or if the error has no specific message.
 * @returns The error message string to be displayed.
 */
export function getDisplayErrorMessage(
  error: Error | null | undefined,
  genericMessage: string = 'An unexpected error occurred. Please try again.'
): string {
  if (process.env.NODE_ENV === 'production') {
    return genericMessage;
  }
  // In development, try to return the specific error message, or its string representation, or fallback to generic.
  return error?.message || error?.toString() || genericMessage;
}

/**
 * Determines whether detailed error information should be shown.
 * Detailed information is typically shown only in development environments.
 *
 * @returns True if error details should be shown (i.e., not in production), false otherwise.
 */
export function shouldShowErrorDetails(): boolean {
  return process.env.NODE_ENV !== 'production';
}
