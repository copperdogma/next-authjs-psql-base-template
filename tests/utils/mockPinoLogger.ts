import { jest } from '@jest/globals';
import pino from 'pino'; // Import pino to get access to standard levels

// Define a type for the mocked logger methods
type MockLogMethods = {
  [key in pino.Level]: jest.Mock<(...args: any[]) => void>;
};

// Define a type for the core mock logger instance
export interface MockPinoLogger extends MockLogMethods {
  child: jest.Mock<(bindings: pino.Bindings) => MockPinoLogger>;
  bindings: () => pino.Bindings;
  silent: jest.Mock<(...args: any[]) => void>;
  // Add other methods/properties if needed for tests, e.g., level
  level: string;
}

/**
 * Creates a Jest mock object that mimics a Pino logger instance,
 * specifically handling the `child` method to propagate calls back to the parent mock.
 *
 * @param {Record<string, number>} [levels=pino.levels.values] - The log levels to mock methods for. Defaults to pino's standard levels.
 * @param {pino.Bindings} [initialBindings={}] - Initial bindings for the root logger.
 * @returns {MockPinoLogger} A Jest mock object representing the Pino logger.
 */
export function createMockPinoLogger(
  levels: Record<string, number> = pino.levels.values,
  initialBindings: pino.Bindings = {}
): MockPinoLogger {
  const mockLogFunctions: Partial<MockLogMethods> = {};
  const levelNames = Object.keys(levels);

  // Create mock functions for each standard log level
  levelNames.forEach((level) => {
    mockLogFunctions[level as pino.Level] = jest.fn();
  });

  const createLoggerMock = (currentBindings: pino.Bindings): MockPinoLogger => {
    const loggerMock: Partial<MockPinoLogger> = { ...mockLogFunctions };

    loggerMock.bindings = jest.fn(() => currentBindings);
    loggerMock.level = 'info'; // Default or allow configuration
    loggerMock.silent = jest.fn(); // Initialize silent mock

    loggerMock.child = jest.fn((childBindings: pino.Bindings) => {
      const newBindings = { ...currentBindings, ...childBindings };
      // Recursively create child mocks, ensuring they also use the *original* mock log functions
      const childMock = createLoggerMock(newBindings);

      // Override child's log methods to call the *parent's* mocks with combined bindings
      levelNames.forEach((level) => {
        childMock[level as pino.Level] = jest.fn((...args: any[]) => {
          // Combine message object if present, otherwise prepend bindings
          let logObject = {};
          let messageArgs = [...args];
          if (typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
            logObject = args[0];
            messageArgs = args.slice(1);
          }
          const finalLogObject = { ...newBindings, ...logObject };

          // Call the original top-level mock function
          loggerMock[level as pino.Level]?.(finalLogObject, ...messageArgs);
        });
      });
      return childMock;
    });

    // Ensure base logger also uses the same mock functions directly
    levelNames.forEach((level) => {
      loggerMock[level as pino.Level] = jest.fn((...args: any[]) => {
        let logObject = {};
        let messageArgs = [...args];
        if (typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
          logObject = args[0];
          messageArgs = args.slice(1);
        }
        const finalLogObject = { ...currentBindings, ...logObject };
        // Call the actual stored mock function for this level
        (mockLogFunctions[level as pino.Level] as jest.Mock)?.(finalLogObject, ...messageArgs);
      });
    });


    return loggerMock as MockPinoLogger;
  };

  return createLoggerMock(initialBindings);
} 