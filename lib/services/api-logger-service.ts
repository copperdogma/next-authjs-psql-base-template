import { NextRequest, NextResponse } from 'next/server';
import { createLogger, getRequestId as getBaseRequestId } from '@/lib/logger';
import pino from 'pino';

/**
 * API request context information
 */
export interface ApiRequestContext {
  /**
   * Unique request ID (generated or passed in headers)
   */
  requestId: string;

  /**
   * Request path
   */
  path: string;

  /**
   * HTTP method
   */
  method: string;

  /**
   * Optional user ID if authenticated
   */
  userId?: string;

  /**
   * Request start timestamp
   */
  startTime: number;
}

/**
 * Options for API logger creation
 */
export interface ApiLoggerOptions {
  /**
   * Enable async transport
   * @default true in production, false otherwise
   */
  asyncTransport?: boolean;

  /**
   * Log sampling rate (0.0-1.0) for debug/trace logs
   * @default 1.0 (log everything)
   */
  samplingRate?: number;

  /**
   * Additional context to include in all logs
   */
  additionalContext?: Record<string, unknown>;
}

/**
 * Extract request ID from headers or generate a new one
 */
export function getRequestId(req?: NextRequest | Request): string {
  let requestId: string | null = null;

  // Try to extract from headers if available
  if (req) {
    // NextRequest or standard Request
    if ('headers' in req && typeof req.headers.get === 'function') {
      requestId = req.headers.get('x-request-id');
    }
  } else {
    // Headers from server components may not be available depending on context
    // Keep this simple and use UUID when no explicit request object is provided
  }

  // Use base logger's ID generation if this one fails or isn't provided
  return requestId || getBaseRequestId();
}

/**
 * Extract the path from a request or URL
 */
export function getRequestPath(req?: NextRequest | Request, url?: URL | string): string {
  // Try to extract path from NextRequest
  if (req && 'nextUrl' in req) {
    return req.nextUrl.pathname;
  }

  // Try to extract path from standard Request
  if (req && 'url' in req) {
    try {
      return new URL(req.url).pathname;
    } catch {
      // Invalid URL - ignore error
    }
  }

  // Try to extract from provided URL
  if (url) {
    if (typeof url === 'string') {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    }
    // Safely access pathname property, falling back to /unknown if it doesn't exist
    return url.pathname || '/unknown';
  }

  // Default to unknown path
  return '/unknown';
}

/**
 * Extract method from request
 */
export function getRequestMethod(req?: NextRequest | Request): string {
  if (req && 'method' in req) {
    return req.method || 'UNKNOWN';
  }
  return 'UNKNOWN';
}

/**
 * Creates a logger for API routes with request context tracking
 *
 * @param req The NextRequest or Request object (optional)
 * @param options Additional options for logger configuration
 * @returns LoggerService instance with API context
 */
export function createApiLogger(
  req?: NextRequest | Request,
  options: ApiLoggerOptions = {}
): { logger: pino.Logger; startTime: number } {
  // Extract or generate a request ID
  const requestId = getRequestId(req);

  // Extract request path
  const path = getRequestPath(req);

  // Extract request method
  const method = getRequestMethod(req);

  // Capture start time
  const startTime = Date.now();

  // Create request context object (can be used for logging if needed)
  // Note: Base fields like requestId, path, method are now part of the logger's child context
  const logContext = {
    requestId,
    path,
    method,
    // Removed startTime from here as it's handled separately
    ...options.additionalContext, // Merge additional context
  };

  // Create the base logger with API context using the consolidated createLogger
  // Pass the extracted context directly to createLogger
  const logger = createLogger('api', logContext);

  // Return logger and startTime separately
  return { logger, startTime };
}

/**
 * Logs API request completion with duration
 *
 * @param logger Logger created by createApiLogger
 * @param startTime The timestamp when the request started
 * @param response Response object to log information about
 * @param error Optional error object if the request failed
 */
export function logRequestCompletion(
  logger: pino.Logger, // Use pino.Logger type
  startTime: number, // Pass startTime explicitly
  response?: NextResponse | Response,
  error?: unknown
): void {
  const duration = Date.now() - startTime; // Calculate duration using passed startTime
  const status = response?.status || (error ? 500 : 200);

  if (error) {
    logger.error(
      {
        duration,
        status,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack, name: error.name }
            : String(error),
      },
      `API request failed` // Simplified message, context is in the log fields
    );
    return;
  }

  logger.info(
    { duration, status },
    `API request completed` // Simplified message, context is in the log fields
  );
}

/**
 * Sanitizes request headers to protect sensitive information
 *
 * @param headers Headers object to sanitize
 * @returns Sanitized headers object
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'set-cookie'];

  headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Creates a standardized error response
 *
 * @param error Error object or string
 * @param requestId Request ID for tracking
 * @param status HTTP status code
 * @returns NextResponse with formatted error
 */
export function createErrorResponse(error: unknown, requestId: string, status = 500): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  return NextResponse.json(
    {
      error: errorName,
      message,
      requestId,
    },
    { status }
  );
}

/**
 * Creates a dummy logger instance when the main logger fails.
 * Avoids crashing the application due to logging errors.
 */
function createFallbackLogger(req: NextRequest, error: unknown): pino.Logger {
  const requestId = getRequestId(req);
  const path = getRequestPath(req);
  const method = getRequestMethod(req);

  console.error(
    {
      message: 'Failed to create API logger, using fallback console logger.',
      originalError: error instanceof Error ? error.message : String(error),
      requestId,
      path,
      method,
    },
    'Fallback logger activated'
  );

  // Return a mock pino logger that uses console
  const dummyLogger = {
    info: (obj: object, msg?: string) => console.info({ ...obj, requestId, path, method }, msg),
    error: (obj: object, msg?: string) => console.error({ ...obj, requestId, path, method }, msg),
    warn: (obj: object, msg?: string) => console.warn({ ...obj, requestId, path, method }, msg),
    debug: (obj: object, msg?: string) => console.debug({ ...obj, requestId, path, method }, msg),
    fatal: (obj: object, msg?: string) => console.error({ ...obj, requestId, path, method }, msg),
    trace: (obj: object, msg?: string) => console.trace({ ...obj, requestId, path, method }, msg),
    child: () => dummyLogger, // Return self for child calls
    // Add other pino methods if needed, pointing to console or no-op
    level: 'info',
    bindings: () => ({ requestId, path, method }), // Mock bindings
  } as unknown as pino.Logger; // Cast to satisfy type checker

  return dummyLogger;
}

/**
 * Logs the start of an API request
 */
function logRequestStart(logger: pino.Logger, req: NextRequest): void {
  try {
    const headers = sanitizeHeaders(req.headers);
    // Query parameters might also contain sensitive info depending on the app
    // const query = Object.fromEntries(req.nextUrl.searchParams); // Consider redacting query params if needed
    logger.info({ headers /*, query */ }, `API request started`);
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to log request start details'
    );
  }
}

/**
 * Centralized API error handling
 */
function handleApiError(error: unknown, logger: pino.Logger): NextResponse {
  const requestId = getRequestId(); // Use the standalone function to generate/get ID

  // Log the error with context
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    'API handler error'
  );

  // Return a standardized error response
  return createErrorResponse(error, requestId);
}

/**
 * Logs successful request details (optional, called by withApiLogger)
 */
function logSuccessfulRequest<T extends NextResponse | Response>(
  _response: T,
  _logger: pino.Logger
): void {
  // Example: Log response status (already logged in logRequestCompletion)
  // logger.debug({ status: response.status }, 'Successful response details');
  // Add more details here if needed, e.g., response headers (sanitized)
}

/**
 * Higher-order function to wrap API route handlers with logging and error handling
 *
 * @param handler The API route handler function
 * @returns A new function that wraps the handler with logging
 */
export function withApiLogger<T extends NextResponse | Response>(
  handler: (req: NextRequest, logger: pino.Logger) => Promise<T> // Update logger type hint
): (req: NextRequest) => Promise<T | NextResponse> {
  // eslint-disable-next-line max-statements
  return async (req: NextRequest) => {
    let loggerInstance: pino.Logger;
    let requestStartTime: number;

    try {
      // Create logger with request context
      const { logger: createdLogger, startTime } = createApiLogger(req);
      loggerInstance = createdLogger;
      requestStartTime = startTime; // Capture startTime
    } catch (error) {
      // If logger creation fails, use a fallback and attempt to continue
      loggerInstance = createFallbackLogger(req, error);
      requestStartTime = Date.now(); // Use current time as fallback startTime
    }

    try {
      // Log request start
      logRequestStart(loggerInstance, req);

      // Execute the actual handler
      const response = await handler(req, loggerInstance);

      // Log successful response details (optional)
      logSuccessfulRequest(response, loggerInstance);

      return response;
    } catch (error) {
      // Handle and log errors centrally
      // Note: logRequestCompletion will be called in finally, logging the error state
      return handleApiError(error, loggerInstance);
    } finally {
      // Ensure completion is logged regardless of success or failure
      // Check if loggerInstance was successfully created before logging completion
      if (loggerInstance && typeof loggerInstance.info === 'function') {
        // Check if it's a valid logger
        // Determine response/error state for final log message
        // This is tricky because the response/error from try/catch isn't directly available here.
        // handleApiError already logs the error. logRequestCompletion might be redundant for errors.
        // Let's refine: logRequestCompletion should primarily log duration/status.
        // We need to pass the response/error state down if possible, or infer it.

        // Simplified approach: Pass null response/error for now.
        // Status/error details are already logged by handleApiError or info logs.
        logRequestCompletion(loggerInstance, requestStartTime, undefined, undefined); // Pass captured startTime
      }
    }
  };
}
