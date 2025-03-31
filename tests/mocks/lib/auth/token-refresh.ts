/**
 * MOCK FILE for testing
 * This is a mock replacement for the removed Firebase auth token refresh logic
 */

/**
 * Interface for configuring backoff behavior
 */
export interface BackoffOptions {
  /**
   * Base delay in milliseconds
   */
  baseDelayMs?: number;

  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs?: number;

  /**
   * Maximum jitter factor (0-1)
   */
  jitterFactor?: number;
}

/**
 * Default options for exponential backoff
 */
export const DEFAULT_BACKOFF_OPTIONS: BackoffOptions = {
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 5 * 60 * 1000, // Max 5 minutes
  jitterFactor: 0.1, // 10% randomness
};

/**
 * Calculates delay for exponential backoff with jitter
 * Uses exponential backoff formula: min(maxDelay, baseDelay * 2^attempt) * (1 + random * jitterFactor)
 */
export function calculateBackoffTime(
  attempt: number,
  options: BackoffOptions = DEFAULT_BACKOFF_OPTIONS
): number {
  const { baseDelayMs = 1000, maxDelayMs = 5 * 60 * 1000, jitterFactor = 0.1 } = options;

  // Calculate base exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter: multiply by random factor between (1 - jitterFactor) and (1 + jitterFactor)
  const jitter = 1 + (Math.random() * jitterFactor * 2 - jitterFactor);

  // Return final delay with jitter
  return Math.floor(cappedDelay * jitter);
}
