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

// --- Internal Helpers for signInWithLogging ---

// Handles signIn with redirect: false
async function _signInRedirectFalse(
  provider: string | undefined,
  options: Parameters<typeof signIn>[1],
  loggingParams: SignInLoggingParams
): Promise<SignInResponse> {
  const result: SignInResponse = await signIn(provider, {
    ...options,
    redirect: false, // Explicitly false
    prompt: 'select_account',
  });
  if (result?.error) {
    logSignInFailure({ ...loggingParams, error: result.error });
  } else if (result?.ok) {
    logSignInSuccess(loggingParams);
  }
  return result;
}

// Handles signIn with redirect: true (or default)
async function _signInRedirectTrue(
  provider: string | undefined,
  options: Parameters<typeof signIn>[1],
  loggingParams: SignInLoggingParams
): Promise<void> {
  const redirectOption = options?.redirect === undefined ? undefined : true;
  await signIn(provider, {
    ...options,
    redirect: redirectOption,
    prompt: 'select_account',
  });
  logSignInSuccess(loggingParams);
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
  const loggingParams: SignInLoggingParams = { logger, provider, correlationId, startTime };

  logger.info({
    msg: 'Sign-in attempt started',
    provider,
    correlationId,
    ...clientInfo,
  });

  try {
    if (options?.redirect === false) {
      return await _signInRedirectFalse(provider, options, loggingParams);
    } else {
      return await _signInRedirectTrue(provider, options, loggingParams);
    }
  } catch (error) {
    logSignInError({ ...loggingParams, error });
    throw error; // Re-throw error after logging
  }
};

// --- Internal Helpers for signOutWithLogging ---

// Handles signOut with redirect: false
async function _signOutRedirectFalse(
  options: Parameters<typeof signOut>[0],
  logger: LoggerService,
  correlationId: string,
  startTime: number
): Promise<SignOutResponse> {
  logger.debug('[signOutWithLogging] Calling signOut with redirect: false');
  // Define expected return type for redirect: false
  interface SignOutRedirectFalseResponse { url: string; } // Kept local as it's specific
  const result: SignOutRedirectFalseResponse = await signOut({
    ...options,
    redirect: false, // Explicitly false
  });
  const duration = Date.now() - startTime;
  logger.info({
    msg: 'Sign-out successful (redirect: false)',
    correlationId,
    duration,
    resultUrl: result?.url,
  });
  return result;
}

// Handles signOut with redirect: true (or default)
async function _signOutRedirectTrue(
  options: Parameters<typeof signOut>[0],
  logger: LoggerService,
  correlationId: string,
  startTime: number
): Promise<void> {
  logger.debug('[signOutWithLogging] Calling signOut with redirect: true (default)');
  const redirectOption = options?.redirect === undefined ? undefined : true;
  await signOut({
    ...options,
    redirect: redirectOption,
  });
  const duration = Date.now() - startTime;
  logger.info({
    msg: 'Sign-out successful (redirect: true/default)',
    correlationId,
    duration,
  });
}

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
    if (options?.redirect === false) {
      return await _signOutRedirectFalse(options, logger, correlationId, startTime);
    } else {
      return await _signOutRedirectTrue(options, logger, correlationId, startTime);
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

// Minimal type definition for SignOutResponse when redirect is false
// Needed for the wrapper function signature
export interface SignOutResponse {
  url: string;
}

// Re-export original hooks/types if needed elsewhere
export { useSession };
export type { Session } from 'next-auth';
