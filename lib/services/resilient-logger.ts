import { LoggerService } from '../interfaces/services';

/**
 * Options for resilient logger
 */
export interface ResilientLoggerOptions {
  /**
   * Maximum number of retry attempts
   * @default 2
   */
  retries?: number;

  /**
   * Delay between retry attempts in milliseconds (with exponential backoff)
   * @default 500
   */
  retryDelay?: number;

  /**
   * Maximum number of failures before circuit breaker trips
   * @default 5
   */
  maxFailures?: number;

  /**
   * Circuit breaker reset timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;

  /**
   * Whether to fall back to console logging if retry fails
   * @default true
   */
  fallbackToConsole?: boolean;

  /**
   * Log levels that should be considered critical and always attempted to be delivered
   * @default ['error', 'fatal']
   */
  criticalLevels?: string[];
}

/**
 * Type for retry operation
 */
interface RetryOperation {
  level: string;
  args: any[];
  attempt: number;
  maxAttempts: number;
  delayMs: number;
}

/**
 * Logger wrapper that adds error handling, retries, and circuit breaking
 *
 * This service implements the LoggerService interface and adds reliability features:
 * 1. Error handling: Catches exceptions from underlying logger
 * 2. Retry mechanism: Automatically retries failed logging operations
 * 3. Circuit breaker: Temporarily disables logging after multiple failures
 * 4. Fallback logging: Outputs to console if all else fails
 */
export class ResilientLoggerService implements LoggerService {
  private baseLogger: LoggerService;
  private options: Required<ResilientLoggerOptions>;
  private failureCount: number = 0;
  private circuitOpen: boolean = false;
  private circuitTimer: NodeJS.Timeout | null = null;
  private pendingRetries: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new resilient logger
   *
   * @param baseLogger The underlying logger to use
   * @param options Configuration options
   */
  constructor(baseLogger: LoggerService, options: ResilientLoggerOptions = {}) {
    this.baseLogger = baseLogger;
    this.options = {
      retries: options.retries ?? 2,
      retryDelay: options.retryDelay ?? 500,
      maxFailures: options.maxFailures ?? 5,
      resetTimeout: options.resetTimeout ?? 30000,
      fallbackToConsole: options.fallbackToConsole ?? true,
      criticalLevels: options.criticalLevels ?? ['error', 'fatal'],
    };

    // Clean up timers on process exit
    process.on('beforeExit', () => {
      this.clearTimers();
    });
  }

  /**
   * Safely execute a logging operation with error handling
   * @param level Log level ('info', 'error', etc.)
   * @param args Arguments to pass to the logger
   */
  private safeLog(level: string, args: any[]): void {
    // Skip if circuit breaker is open (except for critical logs)
    if (this.circuitOpen && !this.options.criticalLevels.includes(level)) {
      console.warn('Circuit open: Skipping log operation', {
        level,
        circuitResetIn: this.circuitTimer ? 'pending' : 'unknown',
      });
      return;
    }

    try {
      // Call the appropriate log method based on level
      this.callLoggerMethod(level, args);

      // Reset failure count on success
      if (this.failureCount > 0) {
        this.failureCount = 0;
      }
    } catch (error) {
      this.handleLogError(level, args, error);
    }
  }

  /**
   * Call the appropriate method on the base logger with argument handling
   */
  private callLoggerMethod(level: string, args: any[]): void {
    // Use more generic helper method to reduce complexity
    if (level === 'info') {
      this.callMethodWithArgs(this.baseLogger.info.bind(this.baseLogger), args);
    } else if (level === 'error') {
      this.callMethodWithArgs(this.baseLogger.error.bind(this.baseLogger), args);
    } else if (level === 'warn') {
      this.callMethodWithArgs(this.baseLogger.warn.bind(this.baseLogger), args);
    } else if (level === 'debug') {
      this.callMethodWithArgs(this.baseLogger.debug.bind(this.baseLogger), args);
    } else if (level === 'trace' && this.baseLogger.trace) {
      this.callMethodWithArgs(this.baseLogger.trace.bind(this.baseLogger), args);
    } else if (level !== 'trace') {
      throw new Error(`Unsupported log level: ${level}`);
    }
  }

  /**
   * Call a method with the appropriate arguments
   */
  private callMethodWithArgs(method: Function, args: any[]): void {
    if (args.length === 1) {
      method(args[0]);
    } else if (args.length >= 2) {
      method(args[0], args[1]);
    }
  }

  /**
   * Handle an error that occurred during logging
   */
  private handleLogError(level: string, args: any[], error: unknown): void {
    this.failureCount++;

    // Log the error to console
    console.error('Logging error occurred', {
      level,
      error,
      failureCount: this.failureCount,
    });

    // Check if we should trip the circuit breaker
    if (this.failureCount >= this.options.maxFailures) {
      this.tripCircuitBreaker();
    }

    // Attempt to retry the operation
    if (!this.circuitOpen && this.options.retries > 0) {
      this.scheduleRetry({
        level,
        args,
        attempt: 1,
        maxAttempts: this.options.retries,
        delayMs: this.options.retryDelay,
      });
    } else if (this.options.fallbackToConsole) {
      // Last resort - log to console
      this.logToConsole(level, args);
    }
  }

  /**
   * Schedule a retry of a failed log operation
   */
  private scheduleRetry(operation: RetryOperation): void {
    // Generate a unique ID for this retry operation
    const retryId = `${operation.level}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Calculate delay with exponential backoff
    const delay = operation.delayMs * Math.pow(2, operation.attempt - 1);

    console.warn('Retrying log operation', {
      level: operation.level,
      attempt: operation.attempt,
      maxAttempts: operation.maxAttempts,
      delayMs: delay,
    });

    // Schedule the retry
    const timer = setTimeout(() => {
      this.pendingRetries.delete(retryId);

      try {
        // Retry the log operation
        this.safeLog(operation.level, operation.args);
      } catch {
        // If still failing and we have attempts left
        if (operation.attempt < operation.maxAttempts) {
          this.scheduleRetry({
            ...operation,
            attempt: operation.attempt + 1,
          });
        } else if (this.options.fallbackToConsole) {
          // Last resort - log to console
          this.logToConsole(operation.level, operation.args);
        }
      }
    }, delay);

    // Store the timer reference
    this.pendingRetries.set(retryId, timer);
  }

  /**
   * Trip the circuit breaker to prevent further log attempts
   */
  private tripCircuitBreaker(): void {
    if (this.circuitOpen) {
      return; // Already open
    }

    console.warn('Tripping circuit breaker for logging operations', {
      failureCount: this.failureCount,
      resetTimeoutMs: this.options.resetTimeout,
    });

    this.circuitOpen = true;

    // Schedule circuit reset
    this.circuitTimer = setTimeout(() => {
      console.warn('Resetting circuit breaker', {
        timeoutMs: this.options.resetTimeout,
      });
      this.circuitOpen = false;
      this.failureCount = 0;
      this.circuitTimer = null;
    }, this.options.resetTimeout);
  }

  /**
   * Log directly to console as a fallback
   */
  private logToConsole(level: string, args: any[]): void {
    // Extract message and data from args
    const { message, data } = this.extractMessageAndData(args);

    // Format the console output
    const consoleData = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    console.warn('Falling back to console logging', consoleData);

    // Use the appropriate console method based on level
    this.writeToConsole(level, message, data);
  }

  /**
   * Extract message and data from log arguments
   */
  private extractMessageAndData(args: any[]): { message?: string; data?: any } {
    let data: any;
    let message: string | undefined;

    if (args.length === 1) {
      if (typeof args[0] === 'string') {
        message = args[0];
      } else {
        data = args[0];
      }
    } else if (args.length >= 2) {
      data = args[0];
      message = typeof args[1] === 'string' ? args[1] : undefined;
    }

    return { message, data };
  }

  /**
   * Write to the appropriate console method based on level
   */
  private writeToConsole(level: string, message?: string, data?: any): void {
    const consoleMethod = this.getConsoleMethodForLevel(level);
    const logMessage = message || this.getDefaultMessageForLevel(level);
    consoleMethod(logMessage, data);
  }

  /**
   * Get the appropriate console method for the log level
   */
  private getConsoleMethodForLevel(level: string): Function {
    if (level === 'error' || level === 'fatal') {
      return console.error;
    } else if (level === 'warn') {
      return console.warn;
    } else if (level === 'info') {
      return console.info;
    } else {
      // debug or trace
      return console.debug;
    }
  }

  /**
   * Get a default message for a log level if none was provided
   */
  private getDefaultMessageForLevel(level: string): string {
    if (level === 'error' || level === 'fatal') {
      return 'Error log';
    } else if (level === 'warn') {
      return 'Warning log';
    } else if (level === 'info') {
      return 'Info log';
    } else {
      return 'Debug log';
    }
  }

  /**
   * Clear all timers (used during shutdown)
   */
  private clearTimers(): void {
    // Clear circuit breaker timer
    if (this.circuitTimer) {
      clearTimeout(this.circuitTimer);
      this.circuitTimer = null;
    }

    // Clear all pending retry timers
    for (const [id, timer] of this.pendingRetries.entries()) {
      clearTimeout(timer);
      this.pendingRetries.delete(id);
    }
  }

  // LoggerService implementation
  info(obj: object | string, msg?: string): void {
    this.safeLog('info', msg !== undefined ? [obj, msg] : [obj]);
  }

  error(obj: object | string, msg?: string): void {
    this.safeLog('error', msg !== undefined ? [obj, msg] : [obj]);
  }

  warn(obj: object | string, msg?: string): void {
    this.safeLog('warn', msg !== undefined ? [obj, msg] : [obj]);
  }

  debug(obj: object | string, msg?: string): void {
    this.safeLog('debug', msg !== undefined ? [obj, msg] : [obj]);
  }

  trace(obj: object | string, msg?: string): void {
    this.safeLog('trace', msg !== undefined ? [obj, msg] : [obj]);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): LoggerService {
    if (!this.baseLogger.child) {
      return this;
    }

    const childBaseLogger = this.baseLogger.child(bindings);
    return new ResilientLoggerService(childBaseLogger, {
      retries: this.options.retries,
      retryDelay: this.options.retryDelay,
      maxFailures: this.options.maxFailures,
      resetTimeout: this.options.resetTimeout,
      fallbackToConsole: this.options.fallbackToConsole,
      criticalLevels: this.options.criticalLevels,
    });
  }
}
