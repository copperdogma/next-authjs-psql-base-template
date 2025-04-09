/**
 * Action Result Utilities
 *
 * This file provides types and functions for consistent handling of server action results.
 * It creates a standardized pattern for success and error responses from server actions.
 */

/**
 * Generic ActionResult type for server actions
 *
 * @template T The data type returned on success
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Creates a successful action result
 *
 * @param data Optional data to include in the success result
 * @returns An ActionResult with success: true and the provided data
 */
export function createSuccessResult<T>(data?: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error action result
 *
 * @param message Error message to include in the result
 * @returns An ActionResult with success: false and the provided error message
 */
export function createErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    message,
  };
}
