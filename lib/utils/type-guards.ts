/**
 * Common type guard utilities used across the application
 */

/**
 * Type guard to check if a value is a non-null object
 * @param input Any value to check
 * @returns Type predicate confirming the value is a Record<string, unknown>
 */
export const isObject = (input: unknown): input is Record<string, unknown> =>
  typeof input === 'object' && input !== null;

/**
 * Type guard to check if a registration result is a valid User object
 * @param result The result to check
 * @returns Type predicate confirming the value is a User with string id
 */
export function isValidUserResult(result: unknown): result is { id: string } {
  return (
    result !== null &&
    typeof result === 'object' &&
    'id' in result &&
    !(result instanceof Error) &&
    typeof (result as { id: unknown }).id === 'string'
  );
}
