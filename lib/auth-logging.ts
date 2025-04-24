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
import {
  signIn,
  signOut,
  useSession,
} from 'next-auth/react';
import type {
  SignInResponse,
} from 'next-auth/react';
import { createContextLogger } from '@/lib/services/logger-service';
import { v4 as uuidv4 } from 'uuid';
import type { LoggerService } from '@/lib/interfaces/services';

/**
 * Minimal interface for options passed to extractClientInfo
 */
interface ClientInfoOptions {
  callbackUrl?: string;
}

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
export function extractClientInfo(
  options: ClientInfoOptions | undefined,
  isServerSide: boolean
): Record<string, string> {
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
export const signInWithLogging = async (
  ...args: Parameters<typeof signIn>
): Promise<SignInResponse | void> => {
  const [provider, options] = args;
  const correlationId = createCorrelationId();
  const startTime = Date.now();
  const logger = createContextLogger('auth');
  const clientInfo = extractClientInfo(options, false);

  logger.info({
    msg: 'Sign-in attempt started',
    provider,
    correlationId,
    ...clientInfo,
  });

  try {
    // Handle redirect: false case
    if (options?.redirect === false) {
      const result: SignInResponse = await signIn(provider, {
        ...options,
        redirect: false, // Explicitly false
        prompt: 'select_account', // Force account selection every time
      });
      // Log result based on redirect: false response
      if (result?.error) {
        logSignInFailure({ logger, provider, correlationId, startTime, error: result.error });
      } else if (result?.ok) {
        logSignInSuccess({ logger, provider, correlationId, startTime });
      }
      return result; // Return SignInResponse
    } else {
      // Handle redirect: true (or default) case
      // Ensure redirect is explicitly true or undefined for the void promise overload
      const redirectOption = options?.redirect === undefined ? undefined : true;
      await signIn(provider, {
        ...options,
        redirect: redirectOption,
        prompt: 'select_account', // Force account selection every time
      });
      // Log success (cannot log result object as it's void)
      logSignInSuccess({ logger, provider, correlationId, startTime });
      // No return for void
      return;
    }
  } catch (error) {
    logSignInError({ logger, provider, correlationId, startTime, error });
    throw error; // Re-throw error after logging
  }
};

/**
 * Wrapper for NextAuth's signOut function with enhanced logging
 */
export const signOutWithLogging = async (
  ...args: Parameters<typeof signOut>
): Promise<SignOutResponse | void> => {
  const [options] = args;
  const correlationId = createCorrelationId('signout');
  const startTime = Date.now();
  const logger = createContextLogger('auth');
  const clientInfo = extractClientInfo(options, false);

  logger.info({
    msg: 'Sign-out attempt started',
    correlationId,
    ...clientInfo,
  });

  try {
    // Handle redirect: false case
    if (options?.redirect === false) {
       logger.debug('[signOutWithLogging] Calling signOut with redirect: false');
       // Define expected return type for redirect: false
       interface SignOutRedirectFalseResponse { url: string; }
       const result: SignOutRedirectFalseResponse = await signOut({
        ...options,
        redirect: false, // Explicitly false
       });
       // Log successful sign-out (can log result URL)
       const duration = Date.now() - startTime;
       logger.info({
        msg: 'Sign-out successful (redirect: false)',
        correlationId,
        duration,
        resultUrl: result?.url,
       });
       return result; // Return response object
    } else {
      // Handle redirect: true (or default) case
      logger.debug('[signOutWithLogging] Calling signOut with redirect: true (default)');
      // Ensure redirect is explicitly true or undefined for the void promise overload
      const redirectOption = options?.redirect === undefined ? undefined : true;
      await signOut({
        ...options,
        redirect: redirectOption,
      });
      // Log successful sign-out (no result object)
      const duration = Date.now() - startTime;
      logger.info({
        msg: 'Sign-out successful (redirect: true/default)',
        correlationId,
        duration,
      });
      // No return for void
      return;
    }
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
    throw error; // Re-throw error after logging
  }
};

// Re-export original hooks/types if needed elsewhere
export { useSession };
export type { Session } from 'next-auth';

// Define SignOutResponse interface if not already present or imported
// This matches the expected structure for redirect: false
export interface SignOutResponse {
  url: string;
}
