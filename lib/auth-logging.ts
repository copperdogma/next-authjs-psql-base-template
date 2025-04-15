// =============================================================================
// Unit Testing Note:
// Unit testing logging utility functions, especially those tightly coupled with
// authentication flows (like NextAuth signIn/signOut wrappers), can be complex
// to mock effectively within Jest. Tests for this module were skipped.
//
// Validation Strategy:
// The effectiveness of logging is primarily validated by observing log output
// during manual testing, E2E tests, and in deployed environments. Specific
// log messages related to auth events are checked as part of E2E test flows
// where applicable.
// =============================================================================
import { signIn, signOut } from 'next-auth/react';
import type { LoggerService } from '@/lib/interfaces/services';
import { createContextLogger } from '@/lib/services/logger-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logging parameters for sign-in operations
 */
export interface SignInLoggingParams {
  logger?: LoggerService;
  provider: string | undefined;
  correlationId: string;
  startTime: number;
}

/**
 * Parameters for logging sign-in failures
 */
export interface SignInFailureParams extends SignInLoggingParams {
  error: string;
}

/**
 * Parameters for logging sign-in errors
 */
export interface SignInErrorParams extends SignInLoggingParams {
  error: unknown;
}

/**
 * Creates a correlation ID for tracking authentication flows
 */
export function createCorrelationId(prefix: string = 'auth'): string {
  return `${prefix}-${uuidv4()}`;
}

/**
 * Extract client information for logging
 */
export function extractClientInfo(options: any, isServerSide: boolean): Record<string, string> {
  const clientInfo: Record<string, string> = {};

  if (options?.callbackUrl) {
    clientInfo.callbackUrl = options.callbackUrl;
  }

  if (!isServerSide && typeof window !== 'undefined') {
    clientInfo.userAgent = window.navigator.userAgent;
    clientInfo.referrer = document.referrer;
  }

  return clientInfo;
}

/**
 * Log a successful sign-in attempt
 */
export function logSignInSuccess(params: SignInLoggingParams): void {
  const logger = params.logger || createContextLogger('auth');
  const duration = Date.now() - params.startTime;

  logger.info({
    msg: 'Sign-in successful',
    provider: params.provider,
    correlationId: params.correlationId,
    duration,
  });
}

/**
 * Log a failed sign-in attempt
 */
export function logSignInFailure(params: SignInFailureParams): void {
  const logger = params.logger || createContextLogger('auth');
  const duration = Date.now() - params.startTime;

  logger.warn({
    msg: 'Sign-in failed',
    provider: params.provider,
    correlationId: params.correlationId,
    error: params.error,
    duration,
  });
}

/**
 * Log an error during sign-in
 */
export function logSignInError(params: SignInErrorParams): void {
  const logger = params.logger || createContextLogger('auth');
  const duration = Date.now() - params.startTime;

  logger.error({
    msg: 'Error during sign-in',
    provider: params.provider,
    correlationId: params.correlationId,
    error: params.error instanceof Error ? params.error.message : String(params.error),
    stack: params.error instanceof Error ? params.error.stack : undefined,
    duration,
  });
}

/**
 * Wrapper for NextAuth's signIn function with enhanced logging
 */
export const signInWithLogging = async (...args: Parameters<typeof signIn>) => {
  const [provider, options] = args;
  const correlationId = createCorrelationId();
  const startTime = Date.now();
  const logger = createContextLogger('auth');

  // Log the sign-in attempt
  const clientInfo = extractClientInfo(options, false);
  logger.info({
    msg: 'Sign-in attempt started',
    provider,
    correlationId,
    ...clientInfo,
  });

  try {
    // Call the original signIn function
    const result = await signIn(provider, {
      ...options,
      redirect: options?.redirect ?? true,
    });

    // If redirect is false, we'll get a result back
    if (result) {
      if (result.error) {
        // Sign-in failed
        logSignInFailure({
          logger,
          provider,
          correlationId,
          startTime,
          error: result.error,
        });
      } else if (result.ok) {
        // Sign-in succeeded
        logSignInSuccess({ logger, provider, correlationId, startTime });
      }
    }

    return result;
  } catch (error) {
    // Log any errors
    logSignInError({ logger, provider, correlationId, startTime, error });
    throw error;
  }
};

/**
 * Wrapper for NextAuth's signOut function with enhanced logging
 */
export const signOutWithLogging = async (...args: Parameters<typeof signOut>) => {
  const [options] = args;
  const correlationId = createCorrelationId('signout');
  const startTime = Date.now();
  const logger = createContextLogger('auth');

  // Log the sign-out attempt
  const clientInfo = extractClientInfo(options, false);
  logger.info({
    msg: 'Sign-out attempt started',
    correlationId,
    ...clientInfo,
  });

  try {
    // Call the original signOut function
    const result = await signOut({
      ...options,
      redirect: options?.redirect ?? true,
    });

    // Log successful sign-out
    const duration = Date.now() - startTime;
    logger.info({
      msg: 'Sign-out successful',
      correlationId,
      duration,
    });

    return result;
  } catch (error) {
    // Log any errors
    const duration = Date.now() - startTime;
    logger.error({
      msg: 'Error during sign-out',
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    throw error;
  }
};
