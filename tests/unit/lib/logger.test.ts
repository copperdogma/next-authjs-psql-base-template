/**
 * @jest-environment node
 */

// Import mocks first
import { mockPinoLogger, resetMocks } from '../../utils/mocks';
import type pino from 'pino';
import pinoReal from 'pino'; // Import the actual pino function

// Mock pino before importing logger
jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: 'info',
    silent: jest.fn(),
    bindings: jest.fn(),
    flush: jest.fn(),
    isLevelEnabled: jest.fn(),
    levelVal: 30,
    levels: {
      values: {
        fatal: 60,
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
        trace: 10,
      },
      labels: {
        10: 'trace',
        20: 'debug',
        30: 'info',
        40: 'warn',
        50: 'error',
        60: 'fatal',
      },
    },
    version: '1.0.0',
    useLevelLabels: true,
    onChild: jest.fn(),
    on: jest.fn(),
    addLevel: jest.fn(),
    isLoggingLevel: jest.fn(),
    LOG_VERSION: 1,
    LOG_LEVEL: 'info',
    setBindings: jest.fn(),
    LOG_NAME: 'test-logger',
    LOG_HOSTNAME: 'test-host',
    LOG_PID: 123,
    LOG_TIME: new Date().toISOString(),
    LOG_REQID: 'test-req-id',
    LOG_MSGID: 'test-msg-id',
    LOG_CONTEXT: 'test-context',
    LOG_LEVEL_NUM: 30,
    LOG_LEVEL_LABEL: 'info',
    LOG_LEVEL_VALUE: 30,
    LOG_LEVEL_NAME: 'info',
    LOG_LEVEL_COLOR: 'blue',
  } as unknown as pino.Logger;

  return {
    __esModule: true,
    default: jest.fn(() => mockLogger),
  };
});

// Import only the needed logger functions
import { createLogger, getRequestId } from '../../../lib/logger';

// Mock pino instance using the real function
const mockLogger = pinoReal({
  enabled: false, // Prevent actual logging during tests
});

// Mock the Math.random function for predictable request IDs
jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

describe('Logger', () => {
  let mockLogger: pino.Logger;
  let originalMathRandom: () => number;

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    mockLogger = require('pino').default();
    originalMathRandom = Math.random;
    Math.random = jest.fn();
  });

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  describe('createLogger', () => {
    test('should create a child logger with context', () => {
      const logger = createLogger('test-context', { additionalData: 'test' });
      expect(mockLogger.child).toHaveBeenCalledWith({
        context: 'test-context',
        additionalData: 'test',
      });
    });
  });

  describe('getRequestId', () => {
    test('should generate a unique request ID', () => {
      // Mock Math.random to return a specific value
      (Math.random as jest.Mock).mockReturnValue(0.123456789);

      // Call getRequestId and verify the result
      const id = getRequestId();
      expect(id).toMatch(/^req_[a-z0-9]{8}$/);
      expect(Math.random).toHaveBeenCalled();
    });

    test('should generate different IDs for multiple calls', () => {
      // Mock Math.random to return different values
      (Math.random as jest.Mock).mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

      const id1 = getRequestId();
      const id2 = getRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  // REMOVE tests for shouldSample
  // describe('shouldSample', () => {
  //   test('should return true for IDs that fall within the sampling rate', () => { ... });
  //   test('should return false for IDs that fall outside the sampling rate', () => { ... });
  //   test('should use default rate of 0.1 if not specified', () => { ... });
  // });

  // REMOVE tests for createSampledLogger
  // describe('createSampledLogger', () => {
  //   let mockChildLogger: pino.Logger;
  //   beforeEach(() => { ... });
  //   afterEach(() => { ... });
  //   test('should create a sampled logger with wrapped methods', () => { ... });
  //   test('should only log messages that fall within the sampling rate', () => { ... });
  //   test('should use provided requestId if available', () => { ... });
  //   test('should preserve the original logger methods', () => { ... });
  // });
});
