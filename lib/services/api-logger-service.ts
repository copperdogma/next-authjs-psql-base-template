import { NextRequest, NextResponse } from 'next/server';
import { LoggerService } from '../interfaces/services';
import { createContextLogger } from './logger-service';
import { v4 as uuidv4 } from 'uuid';

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

  return requestId || uuidv4();
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
): LoggerService & { context: ApiRequestContext } {
  // Extract or generate a request ID
  const requestId = getRequestId(req);

  // Extract request path
  const path = getRequestPath(req);

  // Extract request method
  const method = getRequestMethod(req);

  // Capture start time
  const startTime = Date.now();

  // Create request context
  const context: ApiRequestContext = {
    requestId,
    path,
    method,
    startTime,
  };

  // Determine if we should use async transport
  const asyncTransport = options.asyncTransport ?? process.env.NODE_ENV === 'production';

  // Create the base logger with API context
  const logger = createContextLogger(
    'api', // Base component name
    {
      level: process.env.LOG_LEVEL || 'info',
      baseOptions: {
        // Add context to all logs via base object
        base: {
          ...context,
          ...options.additionalContext,
        },
      },
      transport: asyncTransport
        ? {
            target: 'pino/file',
            options: {
              destination: process.env.LOG_FILE || 'logs/api.log',
              mkdir: true,
            },
          }
        : undefined,
    }
  );

  // Return logger with attached context for duration calculation
  const loggerWithContext = Object.assign(logger, { context });
  return loggerWithContext;
}

/**
 * Logs API request completion with duration
 *
 * @param logger Logger created by createApiLogger
 * @param response Response object to log information about
 * @param error Optional error object if the request failed
 */
export function logRequestCompletion(
  logger: LoggerService & { context?: ApiRequestContext },
  response?: NextResponse | Response,
  error?: unknown
): void {
  // Check for missing context
  if (!logger.context) {
    logger.error({ msg: 'Logger missing context - not created with createApiLogger' });
    return;
  }

  const duration = Date.now() - logger.context.startTime;
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
      `API request failed: ${logger.context.method} ${logger.context.path}`
    );
    return;
  }

  logger.info(
    { duration, status },
    `API request completed: ${logger.context.method} ${logger.context.path}`
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
 * Creates a fallback dummy logger if the main logger creation fails
 */
function createFallbackLogger(req: NextRequest, error: unknown): LoggerService {
  console.warn('Failed to create API logger', error);

  // Create a dummy logger that won't break the application
  const dummyLogger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    // Include context for internal use
    context: {
      requestId: 'fallback',
      startTime: Date.now(),
      path: req.nextUrl.pathname,
      method: req.method,
    },
  };

  return dummyLogger as unknown as LoggerService;
}

/**
 * Logs the start of an API request
 */
function logRequestStart(logger: LoggerService, req: NextRequest): void {
  try {
    logger.info(
      {
        url: req.nextUrl.toString(),
        headers: sanitizeHeaders(req.headers),
      },
      `API request started: ${req.method} ${req.nextUrl.pathname}`
    );
  } catch (error) {
    // If logging fails, log to console but continue
    console.warn('Failed to log API request start', error);
  }
}

/**
 * Handles API request errors with appropriate logging and response generation
 */
function handleApiError(error: unknown, logger: LoggerService): NextResponse {
  // Try to log error
  try {
    logRequestCompletion(logger, undefined, error);
  } catch (logErr) {
    console.error('Failed to log API request error', logErr);
  }

  // Try to return standardized error response
  try {
    return createErrorResponse(error, logger.context?.requestId || 'unknown');
  } catch (responseErr) {
    // Last resort fallback
    console.error('Failed to create error response', responseErr);
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Logs the completion of a successful API request
 */
function logSuccessfulRequest<T extends NextResponse | Response>(
  response: T,
  logger: LoggerService
): void {
  try {
    if (response && typeof response === 'object' && 'status' in response) {
      logRequestCompletion(logger, response as unknown as Response);
    } else {
      logRequestCompletion(logger);
    }
  } catch (logErr) {
    console.warn('Failed to log API request completion', logErr);
  }
}

/**
 * Wrapper function for API route handlers that adds logging
 *
 * @param handler Original API route handler
 * @returns Wrapped handler with logging
 */
export function withApiLogger<T extends NextResponse | Response>(
  handler: (req: NextRequest, logger: LoggerService) => Promise<T>
): (req: NextRequest) => Promise<T | NextResponse> {
  return async (req: NextRequest) => {
    // Initialize logger
    const logger = await Promise.resolve()
      .then(() => createApiLogger(req))
      .catch(error => createFallbackLogger(req, error));

    // Log request start
    logRequestStart(logger, req);

    try {
      // Call original handler with logger
      const response = await handler(req, logger);

      // Log request completion
      logSuccessfulRequest(response, logger);

      return response;
    } catch (error) {
      return handleApiError(error, logger);
    }
  };
}
