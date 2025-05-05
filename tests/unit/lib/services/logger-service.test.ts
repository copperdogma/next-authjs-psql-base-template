import { jest } from '@jest/globals';

// --- Mock Pino Instance Methods (Not the factory) ---
const mockPinoInstance = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn(),
};

// Mock pino factory function
const mockPinoFactory = jest.fn().mockReturnValue(mockPinoInstance);

// Mock the pino module
jest.mock('pino', () => {
  return mockPinoFactory;
});

// Mock the redactFields import
jest.mock('../../../../lib/logger', () => ({
  redactFields: ['password', 'token'], // Provide some example fields
}));

// Save original env for restoration
const originalEnv = { ...process.env };

// --- End Mocks --- //

import {
  PinoLoggerService,
  createContextLogger,
  createDevLogger,
  createRequestLogger,
  createFileLogger,
  createLoggerService,
} from '../../../../lib/services/logger-service';

// Use beforeAll only for things not related to pino mock factory
beforeAll(async () => {
  // Configure the mock child method for reuse in spy
  mockPinoInstance.child.mockReturnValue(mockPinoInstance);
});

afterAll(() => {
  // Restore original env
  process.env = originalEnv;
});

describe('PinoLoggerService', () => {
  beforeEach(() => {
    // Reset process.env to original state for each test
    process.env = { ...originalEnv };

    // Clear all mocks (including mockPinoInstance methods)
    jest.clearAllMocks();

    // Reconfigure child mock return value if needed
    mockPinoInstance.child.mockReturnValue(mockPinoInstance);
  });

  test('constructor calls pino with correct options and string context', () => {
    // Now we can verify pino() call with our factory mock
    const context = 'test-component';
    const service = new PinoLoggerService(context);

    expect(service).toBeDefined();
    expect(mockPinoFactory).toHaveBeenCalledTimes(1);

    // Verify the options object contains expected properties
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options).toHaveProperty('level', 'info');
    expect(options).toHaveProperty('redact.paths');
    expect(options.redact.paths).toEqual(['password', 'token']);

    // Verify child was called with the right context
    expect(mockPinoInstance.child).toHaveBeenCalledWith({ component: context });
  });

  test('constructor calls pino with correct options and object context', () => {
    const context = { component: 'test', requestId: '123' };
    const service = new PinoLoggerService(context);

    expect(service).toBeDefined();
    expect(mockPinoFactory).toHaveBeenCalledTimes(1);

    // Verify child was called with the right context object
    expect(mockPinoInstance.child).toHaveBeenCalledWith(context);
  });

  test('constructor uses LOG_LEVEL environment variable when provided', () => {
    // Set environment variable
    process.env.LOG_LEVEL = 'debug';

    const service = new PinoLoggerService('test');

    // Verify log level from env was used
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options.level).toBe('debug');
  });

  test('constructor uses provided level over environment variable', () => {
    // Set environment variable
    process.env.LOG_LEVEL = 'debug';

    // Create with explicit options
    const service = new PinoLoggerService('test', { level: 'trace' });

    // Verify explicit level was used
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options.level).toBe('trace');
  });

  test('constructor applies pretty printing when requested', () => {
    const service = new PinoLoggerService('test', { pretty: true });

    // Verify pretty transport was configured
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options.transport).toBeDefined();
    expect(options.transport.target).toBe('pino-pretty');
    expect(options.transport.options.colorize).toBe(true);
  });

  test('constructor uses custom transport when provided', () => {
    const customTransport = {
      target: 'pino/file',
      options: { destination: 'custom-log.txt' }
    };

    const service = new PinoLoggerService('test', { transport: customTransport });

    // Verify custom transport was used
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options.transport).toEqual(customTransport);
  });

  test('constructor merges baseOptions when provided', () => {
    const baseOptions = {
      base: { custom: 'value' },
      messageKey: 'customMessage'
    };

    const service = new PinoLoggerService('test', { baseOptions });

    // Verify baseOptions were merged
    const options = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(options.base).toHaveProperty('custom', 'value');
    expect(options).toHaveProperty('messageKey', 'customMessage');

    // Base properties not in baseOptions should still exist
    expect(options.base).toHaveProperty('env');
    expect(options.base).toHaveProperty('app');
  });

  test.each([
    ['info', mockPinoInstance.info],
    ['warn', mockPinoInstance.warn],
    ['error', mockPinoInstance.error],
    ['debug', mockPinoInstance.debug],
    // When testing trace, we expect the underlying 'debug' method to be called
    ['trace', mockPinoInstance.debug],
  ])('%s method calls underlying pino method', (methodName, _mockFn) => { // Use _mockFn as we don't need it
    const context = 'test-component';
    const service = new PinoLoggerService(context);
    const message = `${methodName} message`;
    const data = { data: 123 };

    // Determine the actual underlying method name to spy on
    const underlyingMethodName = methodName === 'trace' ? 'debug' : methodName;

    // Spy on the *instance's* logger method
    const loggerSpy = jest.spyOn((service as any).logger, underlyingMethodName as any);

    // Call the service method (using the original methodName like 'trace')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)[methodName](data, message);

    // Assert the spy was called
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(data, message);

    loggerSpy.mockRestore(); // Clean up spy
  });

  test.each([
    ['info', mockPinoInstance.info],
    ['warn', mockPinoInstance.warn],
    ['error', mockPinoInstance.error],
    ['debug', mockPinoInstance.debug],
    // When testing trace, we expect the underlying 'debug' method to be called
    ['trace', mockPinoInstance.debug],
  ])('%s method handles string message', (methodName, _mockFn) => {
    const context = 'test-component';
    const service = new PinoLoggerService(context);
    const message = `${methodName} string message`;

    // Determine the actual underlying method name to spy on
    const underlyingMethodName = methodName === 'trace' ? 'debug' : methodName;

    // Spy
    const loggerSpy = jest.spyOn((service as any).logger, underlyingMethodName as any);

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)[methodName](message);

    // Assert
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    // Pino methods receive undefined as the second arg when only one is passed
    expect(loggerSpy).toHaveBeenCalledWith(message, undefined);

    loggerSpy.mockRestore();
  });

  test('child method calls pino.child and returns new service wrapping it', () => {
    const baseContext = { base: 'val' };
    const logger = new PinoLoggerService(baseContext);
    const childContext = { child: 'val2' };

    // Spy on the original logger instance's child method
    const childSpy = jest.spyOn((logger as any).logger, 'child');
    childSpy.mockReturnValue(mockPinoInstance); // Ensure it returns our mock instance for consistency

    const childLoggerService = logger.child(childContext);

    // Check that the *spy* on pino.child was called
    expect(childSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledWith(childContext);

    // Check the returned service is of the correct type
    expect(childLoggerService).toBeInstanceOf(PinoLoggerService);

    // Spy on the *child service's* logger's info method
    const childInfoSpy = jest.spyOn((childLoggerService as any).logger, 'info');

    // Call a method on the child logger
    childLoggerService.info('Child log');
    expect(childInfoSpy).toHaveBeenCalledTimes(1);
    // Pino methods receive undefined as the second arg when only one is passed
    expect(childInfoSpy).toHaveBeenCalledWith('Child log', undefined);

    childSpy.mockRestore();
    childInfoSpy.mockRestore();
  });

  test('logs Error object correctly', () => {
    const logger = new PinoLoggerService('error-test');
    const error = new Error('Something failed');
    error.stack = 'mock stack trace';
    const message = 'Caught an error';

    // Spy
    const errorSpy = jest.spyOn((logger as any).logger, 'error');

    // Act
    logger.error(error, message);

    // Assert
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(error, message);

    errorSpy.mockRestore();
  });

  // Add test for multiple child loggers
  test('multiple child loggers maintain their separate contexts', () => {
    const baseLogger = new PinoLoggerService('base');

    // Create spy for the child method on base logger instance
    const childSpy = jest.spyOn((baseLogger as any).logger, 'child');

    // Create two separate mock instances for our child loggers
    const childMock1 = { ...mockPinoInstance, info: jest.fn() };
    const childMock2 = { ...mockPinoInstance, info: jest.fn() };

    // Make child() return different mocks based on the context
    childSpy.mockImplementationOnce(() => childMock1);
    childSpy.mockImplementationOnce(() => childMock2);

    // Create child loggers
    const child1 = baseLogger.child({ module: 'child1' });
    const child2 = baseLogger.child({ module: 'child2' });

    // Verify child was called with the right contexts
    expect(childSpy).toHaveBeenCalledWith({ module: 'child1' });
    expect(childSpy).toHaveBeenCalledWith({ module: 'child2' });

    // Spy on the internal logger instances of the child services
    const child1InfoSpy = jest.spyOn((child1 as any).logger, 'info');
    const child2InfoSpy = jest.spyOn((child2 as any).logger, 'info');

    // Log with both children
    child1.info('Message from child1');
    child2.info('Message from child2');

    // Verify each child's logger was called with the appropriate message
    expect(child1InfoSpy).toHaveBeenCalledWith('Message from child1', undefined);
    expect(child2InfoSpy).toHaveBeenCalledWith('Message from child2', undefined);

    // Clean up spies
    childSpy.mockRestore();
    child1InfoSpy.mockRestore();
    child2InfoSpy.mockRestore();
  });
});

describe('Logger Factories', () => {
  beforeEach(() => {
    // Reset process.env to original state for each test
    process.env = { ...originalEnv };

    jest.clearAllMocks();
    // Reconfigure mockPinoInstance if necessary (e.g., child return value)
    mockPinoInstance.child.mockReturnValue(mockPinoInstance);
  });

  test('createContextLogger sets correct component and passes options', () => {
    const customOptions = { level: 'debug' };
    const logger = createContextLogger('context-test', customOptions);

    expect(logger).toBeInstanceOf(PinoLoggerService);

    // Now we can verify options with our factory mock
    const factoryOptions = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(factoryOptions.level).toBe('debug');

    // Verify component context was set
    expect(mockPinoInstance.child).toHaveBeenCalledWith({ component: 'context-test' });
  });

  test('createDevLogger sets debug level and pretty printing', () => {
    const logger = createDevLogger('dev-test');

    expect(logger).toBeInstanceOf(PinoLoggerService);

    // Verify options
    const factoryOptions = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(factoryOptions.level).toBe('debug');
    expect(factoryOptions.transport.target).toBe('pino-pretty');

    // Verify component context
    if (typeof 'dev-test' === 'string') {
      expect(mockPinoInstance.child).toHaveBeenCalledWith({ component: 'dev-test' });
    } else {
      expect(mockPinoInstance.child).toHaveBeenCalledWith('dev-test');
    }
  });

  test('createRequestLogger sets correct request context', () => {
    const logger = createRequestLogger('req-123', '/api/users', 'GET');

    expect(logger).toBeInstanceOf(PinoLoggerService);

    // Verify context
    expect(mockPinoInstance.child).toHaveBeenCalledWith({
      component: 'api',
      requestId: 'req-123',
      path: '/api/users',
      method: 'GET'
    });
  });

  test('createFileLogger configures file transport', () => {
    // Set LOG_FILE env var to test it
    process.env.LOG_FILE = 'test-log-file.log';

    const logger = createFileLogger('file-test');

    expect(logger).toBeInstanceOf(PinoLoggerService);

    // Verify transport configuration
    const factoryOptions = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(factoryOptions.transport.target).toBe('pino/file');
    expect(factoryOptions.transport.options.destination).toBe('test-log-file.log');
  });

  test('createFileLogger uses default log path when env not set', () => {
    // Ensure LOG_FILE is not set
    delete process.env.LOG_FILE;

    const logger = createFileLogger('file-test');

    // Verify default log path
    const factoryOptions = mockPinoFactory.mock.calls[0][0] as Record<string, any>;
    expect(factoryOptions.transport.options.destination).toBe('logs/app.log');
  });

  test('createLoggerService is backward compatible', () => {
    const logger = createLoggerService('legacy-test');

    expect(logger).toBeInstanceOf(PinoLoggerService);

    // Verify it creates a component context
    expect(mockPinoInstance.child).toHaveBeenCalledWith({ component: 'legacy-test' });
  });
});
