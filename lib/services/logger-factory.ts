import { LoggerService } from '../interfaces/services';
import { PinoLoggerService, PinoLoggerOptions, createContextLogger } from './logger-service';
import { ResilientLoggerService, ResilientLoggerOptions } from './resilient-logger';
import { BatchedLoggerService, BatchedLoggerOptions } from './batched-logger';

/**
 * Options for creating a resilient logger
 */
export interface CreateResilientLoggerOptions {
  /**
   * Context for the logger
   * @default 'app'
   */
  context?: string | Record<string, unknown>;

  /**
   * Base Pino logger options
   */
  pinoOptions?: PinoLoggerOptions;

  /**
   * Resilient logger options
   */
  resilientOptions?: ResilientLoggerOptions;

  /**
   * Whether to create a development logger with pretty printing
   * @default process.env.NODE_ENV !== 'production'
   */
  development?: boolean;
}

/**
 * Creates a logger with error handling, retry and fallback capabilities
 *
 * @param options Configuration options
 * @returns A resilient logger service
 */
export function createResilientLogger(options: CreateResilientLoggerOptions = {}): LoggerService {
  const context = options.context || 'app';
  const development = options.development ?? process.env.NODE_ENV !== 'production';

  // Create base Pino logger
  const baseLogger =
    typeof context === 'string'
      ? createContextLogger(context, {
          level: development ? 'debug' : 'info',
          pretty: development,
          ...options.pinoOptions,
        })
      : new PinoLoggerService(context, {
          level: development ? 'debug' : 'info',
          pretty: development,
          ...options.pinoOptions,
        });

  // Create resilient logger wrapper
  return new ResilientLoggerService(baseLogger, {
    // Default retry configuration
    retries: 2,
    retryDelay: 500,
    // Default circuit breaker configuration (more lenient in development)
    maxFailures: development ? 10 : 5,
    resetTimeout: development ? 10000 : 30000,
    // Always fall back to console for critical errors
    fallbackToConsole: true,
    // Override with user-provided options
    ...options.resilientOptions,
  });
}

/**
 * Creates a resilient logger specifically for API routes with request context
 *
 * @param requestId Unique identifier for the request
 * @param path Request path
 * @param method HTTP method
 * @param options Additional configuration options
 * @returns A resilient logger with request context
 */
export function createResilientApiLogger(
  requestId: string,
  path: string,
  method: string,
  options: CreateResilientLoggerOptions = {}
): LoggerService {
  // Combine API context with any user-provided context
  const apiContext = {
    component: 'api',
    requestId,
    path,
    method,
    ...(typeof options.context === 'object' ? options.context : {}),
  };

  // Create the resilient logger with API context
  return createResilientLogger({
    ...options,
    context: apiContext,
    // API loggers need faster retry for request context
    resilientOptions: {
      retries: 1,
      retryDelay: 100,
      ...options.resilientOptions,
    },
  });
}

/**
 * Creates a resilient logger for error handling scenarios
 *
 * This specialized logger is designed for situations where you're already
 * handling errors and need reliable logging that won't throw additional errors.
 * It uses more aggressive retry settings and always falls back to console.
 *
 * @param context Logger context
 * @returns A highly resilient logger for error handling scenarios
 */
export function createErrorHandlingLogger(
  context: string | Record<string, unknown> = 'error-handler'
): LoggerService {
  return createResilientLogger({
    context,
    resilientOptions: {
      retries: 3,
      retryDelay: 250,
      maxFailures: 10,
      resetTimeout: 60000,
      fallbackToConsole: true,
      criticalLevels: ['error', 'fatal', 'warn'], // Treat warnings as critical too
    },
  });
}

/**
 * Creates a batched logger for high-throughput scenarios
 *
 * This logger buffers non-critical logs and sends them in batches to reduce
 * I/O operations and improve performance in high-throughput scenarios.
 * Critical logs (error/fatal) bypass batching by default.
 *
 * @param options Batching configuration and logger options
 * @returns A batched logger service
 */
export function createBatchedLogger(
  context: string | Record<string, unknown> = 'batched-logger',
  batchOptions: BatchedLoggerOptions = {},
  loggerOptions: CreateResilientLoggerOptions = {}
): LoggerService {
  // First create a resilient logger as the base
  const baseLogger = createResilientLogger({
    context,
    ...loggerOptions,
  });

  // Then wrap it with the batched logger
  return new BatchedLoggerService(baseLogger, {
    // Default batch settings
    maxBatchSize: 100,
    flushInterval: 5000,
    bypassLevels: ['error', 'fatal'],
    // Override with user options
    ...batchOptions,
  });
}
