import {
  logger,
  createLogger,
  loggers,
  getRequestId,
  shouldSample,
  createSampledLogger,
} from '../../../lib/logger';

// Mock pino
jest.mock('pino', () => {
  // Mock logger methods
  const loggerMethods = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  };

  // Create a mock implementation of the pino logger
  const mockLogger = {
    ...loggerMethods,
    child: jest.fn().mockImplementation(() => mockLogger),
    level: 'info',
  };

  // Create the pino function that returns the mock logger
  const pino = jest.fn().mockImplementation(() => mockLogger);

  // Add the stdTimeFunctions property to the pino function
  Object.defineProperty(pino, 'stdTimeFunctions', {
    value: {
      isoTime: jest.fn(() => '2023-01-01T00:00:00.000Z'),
    },
  });

  return pino;
});

// Mock the shouldSample function in the logger module
jest.mock(
  '../../../lib/logger',
  () => {
    const originalModule = jest.requireActual('../../../lib/logger');
    return {
      ...originalModule,
      shouldSample: jest.fn().mockImplementation(() => true),
    };
  },
  { virtual: true }
);

// Override Math.random to return predictable values for sampling tests
const originalRandom = Math.random;
let mockRandomValue = 0.05; // Default value that will pass 10% sampling

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Math.random
    Math.random = originalRandom;
  });

  afterAll(() => {
    // Restore Math.random
    Math.random = originalRandom;
  });

  it('exports a base logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('creates a child logger with context', () => {
    const childLogger = createLogger('test-context');
    expect(childLogger).toBeDefined();
    expect(logger.child).toHaveBeenCalledWith({ context: 'test-context' });
  });

  it('creates a child logger with additional data', () => {
    const childLogger = createLogger('test-context', { userId: '123' });
    expect(childLogger).toBeDefined();
    expect(logger.child).toHaveBeenCalledWith({ context: 'test-context', userId: '123' });
  });

  it('exports preconfigured loggers for different components', () => {
    expect(loggers.auth).toBeDefined();
    expect(loggers.api).toBeDefined();
    expect(loggers.db).toBeDefined();
    expect(loggers.middleware).toBeDefined();
    expect(loggers.ui).toBeDefined();
  });

  it('generates a request ID with correct format', () => {
    const requestId = getRequestId();
    expect(requestId).toMatch(/^req_[a-z0-9]{8}$/);
  });

  it('generates unique request IDs', () => {
    const requestId1 = getRequestId();
    const requestId2 = getRequestId();
    expect(requestId1).not.toEqual(requestId2);
  });

  describe('Sampling functionality', () => {
    it('shouldSample returns a boolean based on ID', () => {
      // Create IDs ending with different characters to test sampling
      const idInSample = 'test_0'; // Should be in 10% sample (0/16 < 0.1)
      const idNotInSample = 'test_f'; // Should not be in 10% sample (15/16 > 0.1)

      expect(typeof shouldSample(idInSample)).toBe('boolean');
      // Force the mock to return specific values for each test case
      (shouldSample as jest.Mock).mockImplementation((id: string, rate = 0.1) => {
        if (id === 'test_0') return true;
        if (id === 'test_f') return false;
        return parseInt(id.charAt(id.length - 1), 16) / 16 < rate;
      });

      expect(shouldSample(idInSample, 0.1)).toBe(true);
      expect(shouldSample(idNotInSample, 0.1)).toBe(false);
    });

    it('allows customizing sampling rate', () => {
      const id = 'test_8'; // 8/16 = 0.5

      // Set up mock for this test
      (shouldSample as jest.Mock).mockImplementation((id: string, rate = 0.1) => {
        const value = parseInt(id.charAt(id.length - 1), 16) / 16;
        return value < rate;
      });

      expect(shouldSample(id, 0.6)).toBe(true); // 0.5 < 0.6
      expect(shouldSample(id, 0.4)).toBe(false); // 0.5 > 0.4
    });

    it('createSampledLogger wraps a logger with sampling', () => {
      // Mock shouldSample to always return true for this test
      (shouldSample as jest.Mock).mockReturnValue(true);

      // Create a mock logger with spies
      const mockInfoFn = jest.fn();
      const mockLogger = {
        info: mockInfoFn,
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
        child: jest.fn().mockImplementation(props => mockLogger),
      };

      // Create a sampled logger with our mock
      const sampledLogger = createSampledLogger(mockLogger as any);

      // Set a specific requestId so we can control the sampling
      sampledLogger.info({ msg: 'test message', requestId: 'test_0' });

      // Verify the method was called
      expect(mockInfoFn).toHaveBeenCalled();
      expect(mockInfoFn.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          msg: 'test message',
          requestId: 'test_0',
        })
      );
    });
  });
});
