/**
 * @jest-environment node
 */

import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { BatchedLoggerService } from '../../../../lib/services/batched-logger';
import { LoggerService } from '../../../../lib/interfaces/services';

// Create a mock logger that implements LoggerService
const createMockLogger = (): LoggerService => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockImplementation(() => createMockLogger()),
});

describe('BatchedLoggerService', () => {
  let mockLogger: LoggerService;
  let batchedLogger: BatchedLoggerService;
  let originalSetInterval: typeof global.setInterval;
  let mockSetInterval: jest.Mock;
  let originalClearInterval: typeof global.clearInterval;
  let mockClearInterval: jest.Mock;
  let mockDateNow: jest.SpyInstance;

  beforeEach(() => {
    // Setup mocks
    mockLogger = createMockLogger();

    // Mock timers
    originalSetInterval = global.setInterval;
    mockSetInterval = jest.fn().mockReturnValue(123);
    global.setInterval = mockSetInterval as unknown as typeof global.setInterval;

    originalClearInterval = global.clearInterval;
    mockClearInterval = jest.fn();
    global.clearInterval = mockClearInterval as unknown as typeof global.clearInterval;

    // Mock Date.now
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1000);

    // Create batched logger with default options
    batchedLogger = new BatchedLoggerService(mockLogger);
  });

  afterEach(() => {
    // Restore mocks
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    mockDateNow.mockRestore();
    jest.clearAllMocks();
  });

  test('constructor sets up flush interval', () => {
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  test('logs are batched and not immediately sent to underlying logger', () => {
    batchedLogger.info('test message');
    batchedLogger.debug({ test: 'object' });

    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalled();
  });

  test('flush sends all batched logs to the underlying logger', () => {
    // Add logs to batch
    batchedLogger.info('test message 1');
    batchedLogger.debug({ test: 'object' });
    batchedLogger.warn('test warning');

    // Manually flush
    batchedLogger.flush();

    // Verify logs were sent to underlying logger
    expect(mockLogger.info).toHaveBeenCalledWith('test message 1');
    expect(mockLogger.debug).toHaveBeenCalledWith({ test: 'object' });
    expect(mockLogger.warn).toHaveBeenCalledWith('test warning');
  });

  test('flush clears the queue', () => {
    // Add logs to batch
    batchedLogger.info('test message');
    batchedLogger.flush();

    // Reset mock
    jest.clearAllMocks();

    // Flush again should not call logger again
    batchedLogger.flush();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  test('error logs bypass batching by default', () => {
    const error = new Error('test error');
    batchedLogger.error(error, 'error message');

    // Error should be logged immediately
    expect(mockLogger.error).toHaveBeenCalledWith(error, 'error message');
  });

  test('auto-flushes when batch size limit is reached', () => {
    // Create logger with small batch size
    const smallBatchLogger = new BatchedLoggerService(mockLogger, { maxBatchSize: 2 });

    // Add logs up to the limit
    smallBatchLogger.info('message 1');
    expect(mockLogger.info).not.toHaveBeenCalled();

    // This should trigger auto-flush
    smallBatchLogger.info('message 2');

    // Verify logs were flushed
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'message 1');
    expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'message 2');
  });

  test('handles log with both object and message string', () => {
    batchedLogger.info({ context: 'test' }, 'test message');
    batchedLogger.flush();

    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'test' }, 'test message');
  });

  test('can customize which levels bypass batching', () => {
    const customBypassLogger = new BatchedLoggerService(mockLogger, {
      bypassLevels: ['warn', 'error'],
    });

    // warn should bypass
    customBypassLogger.warn('warning message');
    // The method should be called with only the message
    expect(mockLogger.warn).toHaveBeenCalledWith('warning message', undefined);

    // debug should be batched
    customBypassLogger.debug('debug message');
    expect(mockLogger.debug).not.toHaveBeenCalled();
  });

  test('child method creates a batched logger with the same options', () => {
    const childLogger = batchedLogger.child({ context: 'child' });

    // Child should be instance of BatchedLoggerService
    expect(childLogger).toBeInstanceOf(BatchedLoggerService);

    // Verify underlying logger's child was called
    expect(mockLogger.child).toHaveBeenCalledWith({ context: 'child' });
  });

  test('cleans up interval on process exit', () => {
    // Save original
    const originalProcessOn = process.on;
    let registeredHandler: Function | undefined;

    // Mock process.on before creating the logger
    process.on = jest.fn().mockImplementation((event, handler) => {
      if (event === 'beforeExit') {
        registeredHandler = handler;
      }
      return process;
    }) as any;

    try {
      // Create a new logger
      const logger = new BatchedLoggerService(mockLogger);

      // Verify handler was registered
      expect(process.on).toHaveBeenCalledWith('beforeExit', expect.any(Function));

      // Check if we captured a handler
      expect(registeredHandler).toBeDefined();

      if (registeredHandler) {
        // Call the handler
        registeredHandler();

        // Verify interval was cleared
        expect(mockClearInterval).toHaveBeenCalledWith(expect.any(Number));
      }
    } finally {
      // Restore original
      process.on = originalProcessOn;
    }
  });
});
