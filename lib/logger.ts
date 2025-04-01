import pino from 'pino';
import { env } from './env';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Define fields that should be redacted from logs
const redactFields = [
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
  level: isDev ? 'debug' : 'info',
  redact: {
    paths: redactFields,
    censor: '[REDACTED]',
    remove: true, // Completely remove secrets instead of replacing with [REDACTED]
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      // Force synchronous logging to avoid worker threads
      sync: true,
    },
  },
  base: {
    env: process.env.NODE_ENV,
    app: env.NEXT_PUBLIC_PWA_APP_NAME || 'next-firebase-psql-template',
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

/**
 * Determines if a particular event should be logged based on sampling rate
 * @param id A unique identifier (like request ID) to use for sampling decision
 * @param rate The sampling rate between 0 and 1 (e.g., 0.1 for 10%)
 * @returns True if this event should be logged, false otherwise
 */
export function shouldSample(id: string, rate = 0.1): boolean {
  // Simple consistent sampling using the last character of the ID
  const lastChar = id.charAt(id.length - 1);
  return parseInt(lastChar, 16) / 16 < rate;
}

/**
 * Creates a sampled logger that only logs a percentage of messages
 * @param baseChildLogger The logger to wrap with sampling
 * @param rate The sampling rate (0-1)
 * @returns A logger with the same interface but that only logs some percentage of messages
 */
export function createSampledLogger(baseChildLogger: pino.Logger, rate = 0.1) {
  const wrappedLogger = Object.create(baseChildLogger);

  // Wrap each logging method with sampling logic
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(level => {
    const originalMethod = baseChildLogger[level as keyof typeof baseChildLogger] as Function;
    wrappedLogger[level] = function (this: any, ...args: any[]) {
      // Extract request ID if available or generate one
      const obj = args[0];
      const requestId = (typeof obj === 'object' && obj?.requestId) || getRequestId();

      // Only log if this request is in the sample
      if (shouldSample(requestId, rate)) {
        return originalMethod.apply(baseChildLogger, args);
      }
    };
  });

  return wrappedLogger;
}

// Export default logger
export default logger;
