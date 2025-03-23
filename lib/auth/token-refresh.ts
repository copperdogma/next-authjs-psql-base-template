import { refreshUserTokenAndSession } from './token';

// Use any for User type to avoid type compatibility issues
// TODO: Replace with proper type when fixing overall Firebase types
type User = any;

/**
 * Options for token refresh with exponential backoff
 */
export interface TokenRefreshOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Exponential backoff factor */
  factor: number;
  /** Whether to add jitter to the delay */
  jitter: boolean;
}

/**
 * Default options for token refresh
 */
export const DEFAULT_OPTIONS: TokenRefreshOptions = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  factor: 2, // exponential factor of 2
  jitter: true, // add randomness to avoid thundering herd problem
};

/**
 * Calculate backoff time based on attempt number and options
 *
 * @param attempt Current attempt number (starting from 1)
 * @param options Backoff options
 * @returns Time to wait in milliseconds
 */
export const calculateBackoffTime = (
  attempt: number,
  options: TokenRefreshOptions = DEFAULT_OPTIONS
): number => {
  // Calculate delay with exponential backoff: initialDelay * (factor ^ (attempt - 1))
  const exponentialDelay = options.initialDelay * Math.pow(options.factor, attempt - 1);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

  // Add jitter if enabled (±20% randomness)
  if (options.jitter) {
    const jitterFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2 range for ±20%
    return Math.floor(cappedDelay * jitterFactor);
  }

  return Math.floor(cappedDelay);
};

/**
 * Type for a function that refreshes a token
 */
export type TokenRefreshFunction<T> = (user: User) => Promise<T>;

/**
 * Refresh a token with exponential backoff on failure
 *
 * @param user Firebase user
 * @param refreshFn Function to refresh the token
 * @param options Backoff options
 * @returns Result from the refresh function
 * @throws Error if all retries fail
 */
export const refreshTokenWithBackoff = async <T>(
  user: User,
  refreshFn: TokenRefreshFunction<T>,
  options: TokenRefreshOptions = DEFAULT_OPTIONS
): Promise<T> => {
  let attempt = 1;
  let lastError: Error | null = null;

  while (attempt <= options.maxRetries) {
    try {
      // Attempt to refresh the token
      const result = await refreshFn(user);
      return result;
    } catch (error) {
      console.warn(`Token refresh attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // If we've reached max retries, throw the last error
      if (attempt >= options.maxRetries) {
        break;
      }

      // Calculate backoff time
      const backoffTime = calculateBackoffTime(attempt, options);
      console.log(`Retrying in ${backoffTime}ms (attempt ${attempt}/${options.maxRetries})`);

      // Wait for the backoff time
      await new Promise(resolve => setTimeout(resolve, backoffTime));

      // Increment attempt counter
      attempt++;
    }
  }

  throw new Error(
    `Token refresh failed after ${options.maxRetries} attempts: ${lastError?.message}`
  );
};

/**
 * Refresh user token with exponential backoff
 *
 * @param user Firebase user
 * @param options Backoff options
 * @returns Result from refreshUserTokenAndSession
 */
export const refreshUserTokenWithBackoff = async (
  user: User,
  options: TokenRefreshOptions = DEFAULT_OPTIONS
): Promise<void> => {
  return refreshTokenWithBackoff(user, refreshUserTokenAndSession, options);
};
