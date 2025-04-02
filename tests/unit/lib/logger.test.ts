/**
 * @jest-environment node
 */

// Import mocks first
import { mockPinoLogger, resetMocks } from '../../utils/mocks';
import type pino from 'pino';

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

// Import the logger module
import { createLogger, getRequestId, shouldSample, createSampledLogger } from '../../../lib/logger';

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
    it('should create a child logger with context', () => {
      const logger = createLogger('test-context', { additionalData: 'test' });
      expect(mockLogger.child).toHaveBeenCalledWith({
        context: 'test-context',
        additionalData: 'test',
      });
    });
  });

  describe('getRequestId', () => {
    it('should generate a unique request ID', () => {
      // Mock Math.random to return a specific value
      (Math.random as jest.Mock).mockReturnValue(0.123456789);

      // Call getRequestId and verify the result
      const id = getRequestId();
      expect(id).toMatch(/^req_[a-z0-9]{8}$/);
      expect(Math.random).toHaveBeenCalled();
    });

    it('should generate different IDs for multiple calls', () => {
      // Mock Math.random to return different values
      (Math.random as jest.Mock).mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

      const id1 = getRequestId();
      const id2 = getRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('shouldSample', () => {
    it('should return true for IDs that fall within the sampling rate', () => {
      // Test with ID ending in '0' (0/16 = 0)
      expect(shouldSample('test0', 0.1)).toBe(true);
      // Test with ID ending in '1' (1/16 ≈ 0.0625)
      expect(shouldSample('test1', 0.1)).toBe(true);
    });

    it('should return false for IDs that fall outside the sampling rate', () => {
      // Test with ID ending in 'a' (10/16 ≈ 0.625)
      expect(shouldSample('testa', 0.1)).toBe(false);
      // Test with ID ending in 'f' (15/16 ≈ 0.9375)
      expect(shouldSample('testf', 0.1)).toBe(false);
    });

    it('should use default rate of 0.1 if not specified', () => {
      expect(shouldSample('test0')).toBe(true); // 0/16 = 0
      expect(shouldSample('testa')).toBe(false); // 10/16 ≈ 0.625
    });
  });

  describe('createSampledLogger', () => {
    beforeEach(() => {
      resetMocks();
      jest.clearAllMocks();
      mockLogger = require('pino').default();
      (Math.random as jest.Mock).mockReturnValue(0);
    });

    it('should create a sampled logger with wrapped methods', () => {
      const sampledLogger = createSampledLogger(mockLogger);
      expect(sampledLogger.info).toBeDefined();
      expect(sampledLogger.warn).toBeDefined();
      expect(sampledLogger.error).toBeDefined();
      expect(sampledLogger.debug).toBeDefined();
    });

    it('should only log messages that fall within the sampling rate', () => {
      const sampledLogger = createSampledLogger(mockLogger, 0.1);

      // First message should be logged (request ID ends in '0')
      sampledLogger.info({ msg: 'test1', requestId: 'test0' });
      expect(mockLogger.info).toHaveBeenCalledWith({ msg: 'test1', requestId: 'test0' });

      // Second message should not be logged (request ID ends in 'a')
      sampledLogger.info({ msg: 'test2', requestId: 'testa' });
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should use provided requestId if available', () => {
      const sampledLogger = createSampledLogger(mockLogger);

      // Message with requestId that will be sampled
      sampledLogger.info({ msg: 'test', requestId: 'test0' });
      expect(Math.random).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith({ msg: 'test', requestId: 'test0' });
    });

    it('should preserve the original logger methods', () => {
      const sampledLogger = createSampledLogger(mockLogger);

      // Call a non-logging method
      sampledLogger.isLevelEnabled('info');
      expect(mockLogger.isLevelEnabled).toHaveBeenCalledWith('info');
    });
  });
});
