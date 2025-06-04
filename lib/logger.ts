import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Determine if we're in development mode
// const isDev = process.env.NODE_ENV !== 'production'; // REMOVED: Unused variable

// Define fields that should be redacted from logs
export const redactFields = [
  'password',
  'passwordConfirm',
  'authorization',
  'cookie',
  'jwt',
  'accessToken',
  'refreshToken',
  'idToken',
  'secret',
  'credit_card',
  'ssn',
  // Additional fields to redact
  'token',
  'session',
  'key',
  'apiKey',
  'csrfToken',
  'credentials',
];

// Create base logger configuration with Next.js-compatible settings
const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info', // Use env var or default to info
  redact: {
    paths: redactFields,
    censor: '[REDACTED]',
    remove: true, // Completely remove secrets instead of replacing with [REDACTED]
  },
  base: {
    env: process.env.NODE_ENV,
    app: 'next-psql-template',
  },
  // Use a simple timestamp function instead of stdTimeFunctions
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: label => {
      return { level: label };
    },
  },
};

// Conditionally add pino-pretty transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,env,app', // Remove redundant base fields from pretty print
    },
  };
}

const baseLogger = pino(pinoOptions);

/**
 * Main application logger
 */
export const logger = baseLogger;

/**
 * Create a child logger with a specific context
 * @param context The context for this logger (e.g., 'auth', 'api', 'db')
 * @param data Additional data to include with every log entry (use unknown for type safety)
 * @returns A child logger instance
 */
export function createLogger(context: string, data: Record<string, unknown> = {}): pino.Logger {
  return logger.child({
    context,
    ...data,
  });
}

/**
 * Pre-configured child loggers for different parts of the application
 */
export const loggers = {
  auth: createLogger('auth'),
  api: createLogger('api'),
  db: createLogger('db'),
  middleware: createLogger('middleware'),
  ui: createLogger('ui'),
};

/**
 * Generate a unique request ID for tracing
 * @returns A unique ID for the current request
 */
export const getRequestId = () => {
  return `req_${uuidv4()}`;
};

// Export default logger
export default logger;
