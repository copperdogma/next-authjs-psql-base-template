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
}

/**
 * Implementation of LoggerService using Pino
 */
export class PinoLoggerService implements LoggerService {
  private logger: pino.Logger;

  /**
   * Create a new PinoLoggerService instance
   *
   * @param context - Context to add to all log messages
   * @param options - Logger configuration options
   */
  constructor(context: string | LogContext, options: PinoLoggerOptions = {}) {
    // Normalize the context parameter
    const logContext = typeof context === 'string' ? { component: context } : context;

    // Create the base logger with default options
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

    // Add pretty printing for development if requested
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

    // Create the logger and add context
    this.logger = pino(loggerOptions).child(logContext);
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

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): LoggerService {
    const childLogger = this.logger.child(bindings);

    // Create a new service that wraps the child logger
    const childService = new PinoLoggerService('', {});
    // Replace the internal logger with the child
    Object.defineProperty(childService, 'logger', {
      value: childLogger,
      writable: false,
    });

    return childService;
  }
}

/**
 * Create a logger service with a component context
 */
export function createContextLogger(
  context: string,
  options: PinoLoggerOptions = {}
): LoggerService {
  return new PinoLoggerService({ component: context }, options);
}

/**
 * Create a logger for development with pretty printing
 */
export function createDevLogger(context: string | LogContext): LoggerService {
  return new PinoLoggerService(context, {
    level: 'debug',
    pretty: true,
  });
}

/**
 * Create a logger for request handling with request context
 */
export function createRequestLogger(
  reqId: string,
  path: string,
  method: string,
  options: PinoLoggerOptions = {}
): LoggerService {
  return new PinoLoggerService(
    {
      component: 'api',
      requestId: reqId,
      path,
      method,
    },
    options
  );
}

/**
 * Create a logger with file transport for production
 */
export function createFileLogger(context: string | LogContext): LoggerService {
  return new PinoLoggerService(context, {
    transport: {
      target: 'pino/file',
      options: { destination: process.env.LOG_FILE || 'logs/app.log' },
    },
  });
}

/**
 * Factory function to create a LoggerService instance (backward compatibility)
 */
export function createLoggerService(context: string): LoggerService {
  return new PinoLoggerService({ component: context });
}
