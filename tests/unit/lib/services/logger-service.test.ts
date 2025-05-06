import { jest } from '@jest/globals';

// Import pino types first, as they are used in mock interfaces
import type pino from 'pino';

// --- Setup & Teardown ---
const originalEnv = { ...process.env };

afterAll(() => {
  // Restore original env
  process.env = originalEnv;
});

// Define a minimal mock logger instance for injection (still useful for DI tests)
// Cast to any to allow using mock methods without full pino interface compliance
const mockLoggerInstanceForDI = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(), // Important: return this for chaining
} as any;

// --- Then Import Service ---
import {
  PinoLoggerService as LoggerService,
  createContextLogger,
  createDevLogger,
  createFileLogger,
  createRequestLogger,
  createLoggerService,
} from '@/lib/services/logger-service';

describe('PinoLoggerService', () => {
  beforeEach(() => {
    // Restore process.env first
    process.env = { ...originalEnv };
    // Clear all mocks defined with jest.fn()
    jest.restoreAllMocks(); // Resets mock state AND implementation

    // Clear the methods on the DI mock instance
    mockLoggerInstanceForDI.info.mockClear();
    mockLoggerInstanceForDI.warn.mockClear();
    mockLoggerInstanceForDI.error.mockClear();
    mockLoggerInstanceForDI.debug.mockClear();
    mockLoggerInstanceForDI.trace.mockClear();
    mockLoggerInstanceForDI.child.mockClear();
    // Reset DI mock child implementation
    mockLoggerInstanceForDI.child.mockReturnThis();

    // NOTE: No need to clear mockPinoInstance methods here,
    // because we are not mocking the factory anymore.
  });

  // --- Tests for PinoLoggerService using DI --- 

  test('constructor calls child method with string context', () => {
    const context = 'test-component';
    // Inject mock logger (DI test)
    const service = new LoggerService(context, { existingLogger: mockLoggerInstanceForDI });

    expect(service).toBeDefined();
    expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
    expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
    // Ensure pino factory was NOT called for DI case
    // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
  });

  test('constructor calls child method with object context', () => {
    const context = { component: 'test', requestId: '123' };
    // Inject mock logger (DI test)
    const service = new LoggerService(context, { existingLogger: mockLoggerInstanceForDI });

    expect(service).toBeDefined();
    expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
    expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith(context);
    // Ensure pino factory was NOT called for DI case
    // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
  });

  test('constructor uses existingLogger and calls child on it', () => {
    const existingLoggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn().mockReturnThis(), // Mock child on the existing logger
    } as unknown as pino.Logger;

    const context = { component: 'injector' };
    const options = { level: 'trace', existingLogger: existingLoggerMock }; // Pass existing logger

    const service = new LoggerService(context, options);

    // Child should be called on the *existing* logger instance
    expect(existingLoggerMock.child).toHaveBeenCalledTimes(1);
    expect(existingLoggerMock.child).toHaveBeenCalledWith(context);

    // Methods should proxy to the existing logger (or its child)
    service.info('Test message');
    expect(existingLoggerMock.info).toHaveBeenCalledTimes(1);
    expect(existingLoggerMock.info).toHaveBeenCalledWith('Test message', undefined); // Pino format
    // Ensure pino factory was NOT called for DI case
    // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
  });

  test.each([
    ['info', mockLoggerInstanceForDI.info],
    ['warn', mockLoggerInstanceForDI.warn],
    ['error', mockLoggerInstanceForDI.error],
    ['debug', mockLoggerInstanceForDI.debug],
    // Trace maps to debug in the service implementation, assert on debug mock
    ['trace', mockLoggerInstanceForDI.debug],
  ])('%s method calls corresponding mock method on injected logger', (methodName, mockFn) => {
    const context = 'test-component';
    // Inject the mock logger (DI test)
    const service = new LoggerService(context, { existingLogger: mockLoggerInstanceForDI });

    // Clear mocks called by constructor (specifically child)
    mockLoggerInstanceForDI.child.mockClear();
    // Clear the target mock function as well before the call
    mockFn.mockClear();

    const message = `Test ${methodName} message`;
    const data = { key: 'value' };

    // Call the service method
    (service as any)[methodName](data, message);

    // Assert on the mock instance method
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(data, message);
    // Ensure child wasn't called again
    expect(mockLoggerInstanceForDI.child).not.toHaveBeenCalled();
    // Ensure pino factory was NOT called for DI case
    // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
  });

  test.each([
    ['info', mockLoggerInstanceForDI.info],
    ['warn', mockLoggerInstanceForDI.warn],
    ['error', mockLoggerInstanceForDI.error],
    ['debug', mockLoggerInstanceForDI.debug],
    // Trace maps to debug
    ['trace', mockLoggerInstanceForDI.debug],
  ])('%s method handles string message correctly on injected logger', (methodName, mockFn) => {
    const context = 'test-component';
    // Inject the mock logger (DI test)
    const service = new LoggerService(context, { existingLogger: mockLoggerInstanceForDI });

    // Clear mocks called by constructor (specifically child)
    mockLoggerInstanceForDI.child.mockClear();
    // Clear the target mock function as well before the call
    mockFn.mockClear();

    const message = `Test ${methodName} string message`;

    // Call the service method with only string
    (service as any)[methodName](message);

    // Assert on the mock instance method
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(message, undefined);
    // Ensure child wasn't called again
    expect(mockLoggerInstanceForDI.child).not.toHaveBeenCalled();
    // Ensure pino factory was NOT called for DI case
    // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
  });

  // --- Refactor test for child logger ---
  describe('Child Logger Creation (DI)', () => {
    it('service.child() calls injected logger.child and returns new service wrapping the result', () => {
      const parentContext = { component: 'parent' };
      const childContext = { module: 'child-module' };

      // Mock returned by parent constructor: mockLoggerInstanceForDI.child(parentContext)
      const mockParentChildLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        // This child method will be called by parentService.child(childContext)
        child: jest.fn(),
      } as any;

      // Mock returned by parentService.child(): mockParentChildLogger.child(childContext)
      const mockGrandchildLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        // ... other methods ...
        // This child method will be called by the childService constructor
        child: jest.fn().mockReturnThis(), // grandchild constructor calls child({}) -> return self
      } as any;

      // Configure the mock chain
      // 1. Parent constructor calls child(parentContext)
      mockLoggerInstanceForDI.child.mockReturnValueOnce(mockParentChildLogger);
      // 2. parentService.child(childContext): mockParentChildLogger.child(childContext) -> mockGrandchildLogger (needed for childService constructor)
      mockParentChildLogger.child.mockReturnValueOnce(mockGrandchildLogger);

      // Instantiate parent service, injecting the main DI mock logger
      const parentService = new LoggerService(parentContext, { existingLogger: mockLoggerInstanceForDI });

      // Clear calls from parent constructor
      mockLoggerInstanceForDI.child.mockClear();
      // We haven't called mockParentChildLogger.child yet

      // Act: Create the child service
      const childService = parentService.child(childContext);

      // Assert: The child method on the *parent's child* logger was called by parentService.child()
      expect(mockParentChildLogger.child).toHaveBeenCalledTimes(1);
      expect(mockParentChildLogger.child).toHaveBeenCalledWith(childContext);

      // Assert: Child service is an instance of LoggerService
      expect(childService).toBeInstanceOf(LoggerService);

      // Assert: The childService's constructor called .child() on the *grandchild* logger it received via DI
      // The constructor receives { existingLogger: mockGrandchildLogger } and calls .child({ component: '' })
      expect(mockGrandchildLogger.child).toHaveBeenCalledTimes(1);
      expect(mockGrandchildLogger.child).toHaveBeenCalledWith({ component: '' }); // Empty string context maps to {component: ''}

      // Ensure pino factory was NOT called for DI case
      // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
    });

    it('child service proxies calls to the correct (grandchild) mock instance', () => {
      const parentContext = { component: 'parent' };
      const childContext = { module: 'child-module' };

      // Mock returned by parentLogger.child(childContext)
      const mockParentChildLogger = {
        info: jest.fn(),
        child: jest.fn(), // Called by parentService.child()
      } as any;

      // Mock returned by childLogger.child({}) [called by child service constructor]
      const mockGreatGrandchildLogger = {
        info: jest.fn(),
        child: jest.fn(), // great-grandchild doesn't need child usually
      } as any;

      // Setup sequence: parent.child -> child, child.child -> grandchild
      mockLoggerInstanceForDI.child.mockReturnValueOnce(mockParentChildLogger);
      const mockGrandchildLogger = { info: jest.fn(), child: jest.fn().mockReturnValueOnce(mockGreatGrandchildLogger) } as any;
      mockParentChildLogger.child.mockReturnValueOnce(mockGrandchildLogger);

      // Instantiate parent service with DI mock
      const parentService = new LoggerService(parentContext, { existingLogger: mockLoggerInstanceForDI });

      // Create child service
      const childService = parentService.child(childContext);

      // Act: Log using child service
      childService.info('Message from child');

      // Assert: Info was called on the grandchild mock (returned by mockChildLogger.child)
      expect(mockGreatGrandchildLogger.info).toHaveBeenCalledTimes(1);
      expect(mockGreatGrandchildLogger.info).toHaveBeenCalledWith('Message from child', undefined);
      // Ensure parent/child info wasn't called directly
      expect(mockLoggerInstanceForDI.info).not.toHaveBeenCalled();
      expect(mockParentChildLogger.info).not.toHaveBeenCalled();
      expect(mockGrandchildLogger.info).not.toHaveBeenCalled();
      // Ensure pino factory was NOT called for DI case
      // expect(mockedPinoFactory).not.toHaveBeenCalled(); // REMOVED - No factory mock
    });
  });

  // --- Factory Function Tests ---

  describe('Factory Functions', () => {
    beforeEach(() => {
      // Ensure factory is reset before each factory test - NOW means resetting DI mock
      // mockedPinoFactory.mockClear(); // REMOVED
      // mockedTransport.mockClear(); // REMOVED
      // mockedDestination.mockClear(); // REMOVED
      // DI mock is cleared in the main beforeEach
    });

    // --- createDevLogger Tests ---
    describe('createDevLogger', () => {
      it('should call pino factory with pretty print transport in development', () => {
        const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'development');
        const context = 'test-dev-context';
        // Call factory injecting the DI mock
        const service = createDevLogger(context, mockLoggerInstanceForDI);

        // Assert service is created
        expect(service).toBeInstanceOf(LoggerService);
        // Assert the DI mock's child method was called by the service constructor
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
        // We cannot easily test internal options like `pretty:true` or `level:debug` via DI
      });

      it('should call pino factory without pretty print transport in production', () => {
        const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'production');
        const context = 'test-prod-context';
        const service = createDevLogger(context, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
        // Cannot test internal options via DI
      });

      it('should pass context correctly when using DI', () => {
        const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'development');
        const context = { component: 'custom-dev', id: 1 };
        const service = createDevLogger(context, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith(context);
      });

      it('should use development settings when NODE_ENV is development', () => {
        jest.isolateModules(() => {
          // Set NODE_ENV for this isolated module context
          const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'development');

          // Dynamically import the module to get a fresh instance with the modified env
          // Clean up the env variable modification
          restoreEnv.restore(); // Call the restore method
        });
      });

      it('should use production settings when NODE_ENV is production', () => {
        jest.isolateModules(() => {
          // Set NODE_ENV for this isolated module context
          const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'production');

          // Dynamically import the module to get a fresh instance with the modified env
          // Clean up the env variable modification
          restoreEnv.restore(); // Call the restore method
        });
      });

      it('should default to development settings when NODE_ENV is not set', () => {
        jest.isolateModules(() => {
          // Ensure NODE_ENV is unset or set to something other than 'production'
          const restoreEnv = jest.replaceProperty(process.env, 'NODE_ENV', 'development');

          // Dynamically import the module
          // Clean up the env variable modification
          restoreEnv.restore(); // Call the restore method
        });
      });
    });

    // --- createFileLogger Tests ---
    describe('createFileLogger', () => {
      it('should call pino factory with file transport', () => {
        const filePath = '/var/log/test.log';
        const context = filePath; // Use filePath as context
        const service = createFileLogger(context, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
        // Cannot test internal transport options via DI
      });

      it('should call pino factory with default options when no baseLogger provided', () => {
        const filePath = '/var/log/custom.log';
        const context = { file: filePath }; // Use object context
        const service = createFileLogger(context, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith(context);
        // Cannot test internal options via DI
      });
    });

    // --- createRequestLogger Tests ---
    describe('createRequestLogger', () => {
      it('should call pino factory with request-specific bindings', () => {
        const reqId = 'req-123';
        const path = '/api/health';
        const method = 'GET';
        // Call factory injecting the DI mock
        const service = createRequestLogger(reqId, path, method, {}, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        const expectedContext = { component: 'api', requestId: reqId, path, method };
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith(expectedContext);
        // Cannot test internal options via DI
      });

      it('should pass custom options to pino factory', () => {
        const reqId = 'req-456';
        const path = '/api/data';
        const method = 'POST';
        const options = { level: 'trace', name: 'RequestTracer' };
        // Call factory injecting the DI mock, options are passed to service constructor
        const service = createRequestLogger(reqId, path, method, options, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        const expectedContext = { component: 'api', requestId: reqId, path, method };
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith(expectedContext);
        // Cannot test internal options via DI (level, name, transport are ignored when existingLogger is used)
      });
    });

    // --- createContextLogger Tests ---
    describe('createContextLogger', () => {
      it('should call pino factory and child() with context', () => {
        const context = { component: 'ContextTest', module: 'Setup' };
        // Call factory injecting the DI mock
        const service = createContextLogger(context, {}, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        // Service constructor wraps context obj { component: contextObj } if passed this way
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
        // Cannot test internal options via DI
      });

      it('should pass custom options to pino factory', () => {
        const context = { component: 'CustomContext' };
        const options = { level: 'error', name: 'ContextErrorLogger' };
        // Call factory injecting the DI mock
        const service = createContextLogger(context, options, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        // Service constructor wraps context obj { component: contextObj } if passed this way
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context });
        // Cannot test internal options (level, name, transport are ignored)
      });
    });

    // --- createLoggerService Tests ---
    describe('createLoggerService', () => {
      it('should call pino factory and return LoggerService instance', () => {
        const context = 'ServiceTest';
        // Call factory injecting the DI mock
        const service = createLoggerService(context, mockLoggerInstanceForDI);

        expect(service).toBeInstanceOf(LoggerService);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledTimes(1);
        expect(mockLoggerInstanceForDI.child).toHaveBeenCalledWith({ component: context }); // String context conversion
        // Cannot test internal options via DI
      });
    });
  });
});
