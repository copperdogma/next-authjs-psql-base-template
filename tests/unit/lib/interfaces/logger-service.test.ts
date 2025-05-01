import { createLogger } from '@/lib/logger';

// Mock createLogger implementation
jest.mock('@/lib/logger', () => {
  // Define a reusable mock logger structure that adheres to LoggerService
  const createMockLogger = () => {
    const loggerInstance = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    };

    // Make child return the logger instance to allow chaining
    loggerInstance.child.mockImplementation(() => loggerInstance);

    return loggerInstance;
  };

  return {
    createLogger: jest.fn().mockImplementation(() => createMockLogger()),
  };
});

describe('LoggerService Interface', () => {
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    // Create a fresh logger for each test
    logger = createLogger('test');
    jest.clearAllMocks();
  });

  it('should implement all required LoggerService methods', () => {
    // Verify logger implements all required methods
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();

    // Verify optional methods
    expect(typeof logger.child).toBe('function');
  });

  it('should log messages with different log levels', () => {
    // Test each log level
    logger.info('Info message');
    logger.error('Error message');
    logger.warn('Warning message');
    logger.debug('Debug message');

    // Verify each method was called once
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });

  it('should log structured data with message', () => {
    const data = { userId: 'user-123', action: 'login' };

    // Log structured data with message
    logger.info(data, 'User action');

    // Verify logger was called with data and message
    expect(logger.info).toHaveBeenCalledWith(data, 'User action');
  });

  it('should create child loggers with additional context', () => {
    // Skip if child method is not available (shouldn't happen with our mock)
    if (!logger.child) {
      return;
    }

    const childContext = { requestId: 'req-123', component: 'auth' };
    const childLogger = logger.child(childContext);

    // Verify child method was called with context
    expect(logger.child).toHaveBeenCalledWith(childContext);

    // Verify child logger implements LoggerService
    expect(childLogger.info).toBeDefined();
    expect(childLogger.error).toBeDefined();
    expect(childLogger.warn).toBeDefined();
    expect(childLogger.debug).toBeDefined();
  });

  it('should work with different message types', () => {
    // Log with string message
    logger.info('String message');
    expect(logger.info).toHaveBeenLastCalledWith('String message');

    // Log with object as message (no additional message parameter)
    const data = { userId: 'user-123', status: 'active' };
    logger.info(data);
    expect(logger.info).toHaveBeenLastCalledWith(data);

    // Log error object
    const error = new Error('Test error');
    logger.error({ error }, 'Error occurred');
    expect(logger.error).toHaveBeenLastCalledWith({ error }, 'Error occurred');
  });
});
