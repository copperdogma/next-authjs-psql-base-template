import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import { ResilientLoggerService } from '../../../../lib/services/resilient-logger';
import { LoggerService } from '../../../../lib/interfaces/services';

// Create a mock logger type that includes our test properties
type MockLogger = LoggerService & {
  throwOnNextCall?: boolean;
  throwOnCalls?: Set<string>;
  callHistory: Array<{ level: string; args: any[] }>;
  child: (bindings: Record<string, unknown>) => MockLogger;
};

// Create a mock logger that implements LoggerService
const createMockLogger = (): MockLogger => {
  const logger: MockLogger = {
    info: jest.fn().mockImplementation(function (this: MockLogger, ...args: any[]) {
      this.callHistory.push({ level: 'info', args });
      if (this.throwOnNextCall || this.throwOnCalls?.has('info')) {
        this.throwOnNextCall = false;
        throw new Error('Simulated info error');
      }
    }),
    error: jest.fn().mockImplementation(function (this: MockLogger, ...args: any[]) {
      this.callHistory.push({ level: 'error', args });
      if (this.throwOnNextCall || this.throwOnCalls?.has('error')) {
        this.throwOnNextCall = false;
        throw new Error('Simulated error error');
      }
    }),
    warn: jest.fn().mockImplementation(function (this: MockLogger, ...args: any[]) {
      this.callHistory.push({ level: 'warn', args });
      if (this.throwOnNextCall || this.throwOnCalls?.has('warn')) {
        this.throwOnNextCall = false;
        throw new Error('Simulated warn error');
      }
    }),
    debug: jest.fn().mockImplementation(function (this: MockLogger, ...args: any[]) {
      this.callHistory.push({ level: 'debug', args });
      if (this.throwOnNextCall || this.throwOnCalls?.has('debug')) {
        this.throwOnNextCall = false;
        throw new Error('Simulated debug error');
      }
    }),
    trace: jest.fn().mockImplementation(function (this: MockLogger, ...args: any[]) {
      this.callHistory.push({ level: 'trace', args });
      if (this.throwOnNextCall || this.throwOnCalls?.has('trace')) {
        this.throwOnNextCall = false;
        throw new Error('Simulated trace error');
      }
    }),
    child: jest.fn(function (this: MockLogger, bindings: Record<string, unknown>): MockLogger {
      const childLogger = createMockLogger();
      childLogger.throwOnNextCall = this.throwOnNextCall;
      childLogger.throwOnCalls = this.throwOnCalls;
      return childLogger;
    }),
    callHistory: [],
    throwOnNextCall: false,
    throwOnCalls: new Set<string>(),
  };
  return logger;
};

// Setup mock logger before tests
let mockLogger: MockLogger;

describe('ResilientLoggerService', () => {
  let resilientLogger: ResilientLoggerService;
  let mockConsoleError: SpyInstance;
  let mockConsoleWarn: SpyInstance;

  beforeEach(() => {
    // Setup mocks
    mockLogger = createMockLogger();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Create resilient logger with default options
    resilientLogger = new ResilientLoggerService(mockLogger);
  });

  afterEach(() => {
    // Restore mocks
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    jest.clearAllMocks();
  });

  test('logs are passed to the underlying logger', () => {
    resilientLogger.info('test message');
    resilientLogger.error({ error: 'test' }, 'error message');
    resilientLogger.warn('warning message');

    expect(mockLogger.info).toHaveBeenCalledWith('test message');
    expect(mockLogger.error).toHaveBeenCalledWith({ error: 'test' }, 'error message');
    expect(mockLogger.warn).toHaveBeenCalledWith('warning message');
  });

  test('handles errors in the underlying logger', () => {
    mockLogger.throwOnNextCall = true;

    // Should not throw
    expect(() => resilientLogger.info('test message')).not.toThrow();

    // Should log to console error
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Logging error'),
      expect.objectContaining({
        level: 'info',
        error: expect.any(Error),
      })
    );
  });

  test('retries logging operations after failures', async () => {
    // Set up to fail once
    mockLogger.throwOnNextCall = true;

    resilientLogger = new ResilientLoggerService(mockLogger, {
      retries: 2,
      retryDelay: 50,
    });

    resilientLogger.error('retry test');

    // First call should fail and retry is scheduled
    expect(mockLogger.error).toHaveBeenCalledTimes(1);

    // Wait for retry
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have retried
    expect(mockLogger.error).toHaveBeenCalledTimes(2);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Retrying log operation'),
      expect.any(Object)
    );
  });

  test('child method creates a resilient logger', () => {
    const childLogger = resilientLogger.child({ context: 'child' });

    // Child should be instance of ResilientLoggerService
    expect(childLogger).toBeInstanceOf(ResilientLoggerService);

    // Verify underlying logger's child was called
    expect(mockLogger.child).toHaveBeenCalledWith({ context: 'child' });

    // Child should have same error handling
    const underlyingChildLogger = mockLogger.child({ context: 'child' });
    // Assert the type of the child logger to access the throwOnNextCall property
    const mockChildLogger = underlyingChildLogger as MockLogger;
    mockChildLogger.throwOnNextCall = true;

    // Should not throw
    expect(() => childLogger.info('test message')).not.toThrow();
  });

  test('falls back to console logging if retry fails', async () => {
    // Create a mock for console methods
    const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Always fail on error logs
    if (mockLogger.throwOnCalls) {
      mockLogger.throwOnCalls.add('error');
    } else {
      mockLogger.throwOnCalls = new Set(['error']);
    }

    // Create resilient logger with fallback enabled and minimal retry delay
    resilientLogger = new ResilientLoggerService(mockLogger, {
      retries: 1,
      retryDelay: 10, // Small delay for faster testing
      fallbackToConsole: true,
    });

    // Call error which will fail
    resilientLogger.error({ test: 'object' }, 'important message');

    // Wait for retry and fallback
    await new Promise(resolve => setTimeout(resolve, 50));

    // Clear the mock call counts to only check the ones from the retry mechanism
    // This ensures we're not counting calls from other error handling logic
    jest.clearAllMocks();

    // Manually trigger an error log again to verify fallback behavior
    resilientLogger.error({ test: 'retry-object' }, 'retry message');

    // Wait for fallback
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify the error was ultimately logged to console.error
    expect(mockConsoleError).toHaveBeenCalledWith('retry message', { test: 'retry-object' });

    // Verify fallback warning was logged
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Falling back to console logging'),
      expect.objectContaining({
        level: 'error',
      })
    );

    // Cleanup
    mockConsoleInfo.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  test('implements circuit breaker pattern', async () => {
    // Always fail
    if (mockLogger.throwOnCalls) {
      ['info', 'error', 'warn', 'debug'].forEach(level => mockLogger.throwOnCalls!.add(level));
    } else {
      mockLogger.throwOnCalls = new Set(['info', 'error', 'warn', 'debug']);
    }

    resilientLogger = new ResilientLoggerService(mockLogger, {
      retries: 1,
      retryDelay: 50,
      maxFailures: 2,
      resetTimeout: 200,
    });

    // First call - will fail and retry
    resilientLogger.info('first call');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second call - will fail, retry, and trip circuit breaker
    resilientLogger.info('second call');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reset mocks to see if third call uses the logger
    jest.clearAllMocks();

    // Third call with circuit open - should not call underlying logger
    resilientLogger.info('third call');
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Circuit open'),
      expect.any(Object)
    );

    // Wait for circuit to close
    await new Promise(resolve => setTimeout(resolve, 200));
    jest.clearAllMocks();

    // Fourth call after reset - should call logger again
    resilientLogger.info('fourth call');
    expect(mockLogger.info).toHaveBeenCalledWith('fourth call');
  });
});
