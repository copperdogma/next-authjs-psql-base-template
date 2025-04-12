import { LoggerService } from '../interfaces/services';

/**
 * Options for batched logger
 */
export interface BatchedLoggerOptions {
  /**
   * Maximum batch size before forced flush
   * @default 100
   */
  maxBatchSize?: number;

  /**
   * Flush interval in milliseconds
   * @default 5000
   */
  flushInterval?: number;

  /**
   * Log levels that should bypass batching (always flushed immediately)
   * @default ['error', 'fatal']
   */
  bypassLevels?: string[];
}

/**
 * Log entry structure for batching
 */
interface LogEntry {
  level: string;
  message: object | string;
  messageStr?: string;
  timestamp: number;
}

/**
 * Logger wrapper that batches logs to improve performance in high-throughput scenarios
 *
 * This service implements the LoggerService interface and batches logs to reduce
 * the number of I/O operations. Critical logs (error/fatal) bypass batching by default
 * to ensure they're logged immediately.
 */
export class BatchedLoggerService implements LoggerService {
  private baseLogger: LoggerService;
  private queue: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout;
  private options: Required<BatchedLoggerOptions>;

  /**
   * Create a new batched logger
   *
   * @param baseLogger The underlying logger to use
   * @param options Batching configuration
   */
  constructor(baseLogger: LoggerService, options: BatchedLoggerOptions = {}) {
    this.baseLogger = baseLogger;
    this.options = {
      maxBatchSize: options.maxBatchSize || 100,
      flushInterval: options.flushInterval || 5000,
      bypassLevels: options.bypassLevels || ['error', 'fatal'],
    };

    // Set up periodic flush
    this.flushInterval = setInterval(() => this.flush(), this.options.flushInterval);

    // Handle process exit
    process.on('beforeExit', () => {
      this.flush();
      clearInterval(this.flushInterval);
    });
  }

  /**
   * Flush all batched logs to the underlying logger
   */
  flush(): void {
    if (this.queue.length === 0) return;

    // Process all queued logs
    const entries = [...this.queue];
    this.queue = [];

    entries.forEach(entry => {
      this.processLogEntry(entry);
    });
  }

  /**
   * Process a single log entry and send it to the underlying logger
   */
  private processLogEntry(entry: LogEntry): void {
    if (entry.messageStr) {
      this.processLogEntryWithMessage(entry.level, entry.message, entry.messageStr);
    } else {
      this.processLogEntrySimple(entry.level, entry.message);
    }
  }

  /**
   * Process a log entry with both message and message string
   */
  private processLogEntryWithMessage(
    level: string,
    message: object | string,
    messageStr: string
  ): void {
    switch (level) {
      case 'info':
        this.baseLogger.info(message, messageStr);
        break;
      case 'error':
        this.baseLogger.error(message, messageStr);
        break;
      case 'warn':
        this.baseLogger.warn(message, messageStr);
        break;
      case 'debug':
        this.baseLogger.debug(message, messageStr);
        break;
      case 'trace':
        if (this.baseLogger.trace) {
          this.baseLogger.trace(message, messageStr);
        }
        break;
    }
  }

  /**
   * Process a log entry with just a message (no message string)
   */
  private processLogEntrySimple(level: string, message: object | string): void {
    switch (level) {
      case 'info':
        this.baseLogger.info(message);
        break;
      case 'error':
        this.baseLogger.error(message);
        break;
      case 'warn':
        this.baseLogger.warn(message);
        break;
      case 'debug':
        this.baseLogger.debug(message);
        break;
      case 'trace':
        if (this.baseLogger.trace) {
          this.baseLogger.trace(message);
        }
        break;
    }
  }

  /**
   * Add a log to the batch queue or flush immediately for certain levels
   */
  private addToBatch(level: string, obj: object | string, msg?: string): void {
    // Check if this level should bypass batching
    if (this.options.bypassLevels.includes(level)) {
      this.logImmediately(level, obj, msg);
      return;
    }

    // Add to queue
    this.queue.push({
      level,
      message: obj,
      messageStr: msg,
      timestamp: Date.now(),
    });

    // Flush if we've reached the max batch size
    if (this.queue.length >= this.options.maxBatchSize) {
      this.flush();
    }
  }

  /**
   * Log immediately to the underlying logger bypassing the batch queue
   */
  private logImmediately(level: string, obj: object | string, msg?: string): void {
    switch (level) {
      case 'info':
        this.baseLogger.info(obj, msg);
        break;
      case 'error':
        this.baseLogger.error(obj, msg);
        break;
      case 'warn':
        this.baseLogger.warn(obj, msg);
        break;
      case 'debug':
        this.baseLogger.debug(obj, msg);
        break;
      case 'trace':
        if (this.baseLogger.trace) {
          this.baseLogger.trace(obj, msg);
        }
        break;
    }
  }

  // LoggerService implementation
  info(obj: object | string, msg?: string): void {
    this.addToBatch('info', obj, msg);
  }

  error(obj: object | string, msg?: string): void {
    this.addToBatch('error', obj, msg);
  }

  warn(obj: object | string, msg?: string): void {
    this.addToBatch('warn', obj, msg);
  }

  debug(obj: object | string, msg?: string): void {
    this.addToBatch('debug', obj, msg);
  }

  trace(obj: object | string, msg?: string): void {
    this.addToBatch('trace', obj, msg);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): LoggerService {
    if (this.baseLogger.child) {
      const childBaseLogger = this.baseLogger.child(bindings);
      return new BatchedLoggerService(childBaseLogger, {
        maxBatchSize: this.options.maxBatchSize,
        flushInterval: this.options.flushInterval,
        bypassLevels: this.options.bypassLevels,
      });
    }
    return this;
  }
}
