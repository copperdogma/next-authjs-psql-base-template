import pino from 'pino';

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
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info', // Use env var or default to info
  redact: {
    paths: redactFields,
    censor: '[REDACTED]',
    remove: true, // Completely remove secrets instead of replacing with [REDACTED]
  },
  // REMOVED Transport config - let output go to stdout as JSON by default
  // transport: { ... },
  base: {
    env: process.env.NODE_ENV,
    app: 'next-firebase-psql-template',
  },
  // Use a simple timestamp function instead of stdTimeFunctions
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: label => {
      return { level: label };
    },
  },
});

/**
 * Main application logger
 */
export const logger = baseLogger;

/**
 * Create a child logger with a specific context
 * @param context The context for this logger (e.g., 'auth', 'api', 'db')
 * @param data Additional data to include with every log entry
 * @returns A child logger instance
 */
export function createLogger(context: string, data: Record<string, any> = {}) {
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
  return `req_${Math.random().toString(36).substring(2, 10)}`;
};

// Export default logger
export default logger;
