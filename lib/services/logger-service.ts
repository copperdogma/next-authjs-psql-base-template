import { LoggerService } from '../interfaces/services';
import pino from 'pino';
import { redactFields as baseRedactFields } from '../logger';

type LogContext = Record<string, unknown>;

/**
 * Options for creating a Pino logger
 */
export interface PinoLoggerOptions {
  /**
   * Log level
   * @default 'info'
   */
  level?: string;

  /**
   * Use pretty printing for development
   * @default false
   */
  pretty?: boolean;

  /**
   * Base logger options to extend
   */
  baseOptions?: pino.LoggerOptions;

  /**
   * Transport configuration
   */
  transport?: pino.TransportSingleOptions;

  /**
   * Optional existing Pino logger instance to use.
   * If provided, other options like level, transport, baseOptions, pretty are ignored for the base instance,
   * but context will still be applied via .child().
   */
  existingLogger?: pino.Logger;
}

/**
 * Implementation of LoggerService using Pino
 */
export class PinoLoggerService implements LoggerService {
  public readonly logger: pino.Logger;

  /**
   * Create a new PinoLoggerService instance
   *
   * @param context - Context to add to all log messages
   * @param options - Logger configuration options, including optional existingLogger
   */
  constructor(context: string | LogContext, options: PinoLoggerOptions = {}) {
    const logContext = typeof context === 'string' ? { component: context } : context;

    let baseLogger: pino.Logger;

    if (options.existingLogger) {
      // Use the provided logger instance
      baseLogger = options.existingLogger;
    } else {
      // Create a new base logger instance
      const loggerOptions: pino.LoggerOptions = {
        level: options.level || process.env.LOG_LEVEL || 'info',
        redact: {
          paths: Array.isArray(baseRedactFields) ? baseRedactFields : [],
          censor: '[REDACTED]',
          remove: true,
        },
        base: {
          env: process.env.NODE_ENV,
          app: 'next-firebase-psql-template',
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        formatters: {
          level: label => {
            return { level: label };
          },
        },
        ...options.baseOptions,
      };

      if (options.pretty) {
        loggerOptions.transport = {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: true,
            ignore: 'pid,hostname',
          },
        };
      } else if (options.transport) {
        loggerOptions.transport = options.transport;
      }
      baseLogger = pino(loggerOptions);
    }

    // Apply context by creating a child logger
    // This ensures context is applied even when injecting an existing logger
    this.logger = baseLogger.child(logContext);
  }

  info(obj: object | string, msg?: string): void {
    this.logger.info(obj, msg);
  }

  error(obj: object | string, msg?: string): void {
    this.logger.error(obj, msg);
  }

  warn(obj: object | string, msg?: string): void {
    this.logger.warn(obj, msg);
  }

  debug(obj: object | string, msg?: string): void {
    this.logger.debug(obj, msg);
  }

  trace(obj: object | string, msg?: string): void {
    this.logger.debug(obj, msg);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): LoggerService {
    // Create a child directly from the internal logger
    const childPinoLogger = this.logger.child(bindings);
    // Wrap the pino child logger in a new service instance, injecting it
    // Pass empty context ('') and the child logger instance
    // The constructor will then apply its empty context (no-op) via child()
    const childService = new PinoLoggerService('', { existingLogger: childPinoLogger });
    return childService;
  }
}

/**
 * Create a logger service with a component context
 */
export function createContextLogger(
  context: string | LogContext,
  options: PinoLoggerOptions = {},
  baseLogger?: pino.Logger // Optional base logger
): LoggerService {
  // Pass the baseLogger via options
  return new PinoLoggerService({ component: context }, { ...options, existingLogger: baseLogger });
}

/**
 * Create a logger for development with pretty printing
 */
export function createDevLogger(
  context: string | LogContext,
  baseLogger?: pino.Logger // Optional base logger
): LoggerService {
  return new PinoLoggerService(context, {
    level: 'debug',
    pretty: true,
    existingLogger: baseLogger, // Pass it here
  });
}

/**
 * Create a logger for request handling with request context
 */
export function createRequestLogger(
  requestContext: { reqId: string; path: string; method: string },
  options: PinoLoggerOptions = {},
  baseLogger?: pino.Logger // Optional base logger
): LoggerService {
  return new PinoLoggerService(
    {
      component: 'api',
      requestId: requestContext.reqId,
      path: requestContext.path,
      method: requestContext.method,
    },
    { ...options, existingLogger: baseLogger } // Pass it via options
  );
}

/**
 * Create a logger with file transport for production
 */
export function createFileLogger(
  context: string | LogContext,
  baseLogger?: pino.Logger // Optional base logger
): LoggerService {
  return new PinoLoggerService(context, {
    transport: {
      target: 'pino/file',
      options: { destination: process.env.LOG_FILE || 'logs/app.log' },
    },
    existingLogger: baseLogger, // Pass it here
  });
}

/**
 * Factory function to create a LoggerService instance (backward compatibility)
 */
export function createLoggerService(
  context: string | LogContext,
  baseLogger?: pino.Logger // Optional base logger
): LoggerService {
  return new PinoLoggerService({ component: context }, { existingLogger: baseLogger });
}
