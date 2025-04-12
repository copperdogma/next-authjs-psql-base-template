import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Mock the modules
jest.mock('../../../../lib/services/resilient-logger', () => {
  return {
    ResilientLoggerService: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(),
    })),
  };
});

jest.mock('../../../../lib/services/logger-service', () => {
  return {
    PinoLoggerService: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(),
    })),
    createContextLogger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(),
    })),
  };
});

// Import after mocking
import {
  createResilientLogger,
  createResilientApiLogger,
  createErrorHandlingLogger,
} from '../../../../lib/services/logger-factory';

describe('Logger Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality verification', () => {
    test('createResilientLogger returns a valid logger object', () => {
      // With default options
      const logger = createResilientLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.child).toBe('function');

      // With development flag
      const devLogger = createResilientLogger({ development: true });
      expect(devLogger).toBeDefined();
      expect(typeof devLogger.info).toBe('function');

      // With production flag
      const prodLogger = createResilientLogger({ development: false });
      expect(prodLogger).toBeDefined();
      expect(typeof prodLogger.info).toBe('function');

      // With custom options
      const customLogger = createResilientLogger({
        context: 'custom-component',
        resilientOptions: {
          retries: 5,
          maxFailures: 10,
        },
      });
      expect(customLogger).toBeDefined();
      expect(typeof customLogger.info).toBe('function');
    });

    test('createResilientApiLogger returns a valid logger object', () => {
      const logger = createResilientApiLogger('req-123', '/api/test', 'GET');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');

      // With additional context
      const contextLogger = createResilientApiLogger('req-123', '/api/test', 'GET', {
        context: { userId: 'user-456' },
      });
      expect(contextLogger).toBeDefined();
      expect(typeof contextLogger.info).toBe('function');
    });

    test('createErrorHandlingLogger returns a valid logger object', () => {
      const logger = createErrorHandlingLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');

      // With custom context
      const contextLogger = createErrorHandlingLogger('custom-error-handler');
      expect(contextLogger).toBeDefined();
      expect(typeof contextLogger.info).toBe('function');
    });
  });
});
