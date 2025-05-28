import { jest } from '@jest/globals';
import { prismaMock, resetPrismaMock } from '../../mocks/db/prismaMocks'; // Updated path
import pino from 'pino';

// --- Global Pino Mock ---

// Create a simplified mock pino instance for global use
// This instance's methods (.info, .warn, etc.) can be spied on by individual tests if needed.
export const mockPinoInstanceFromGlobalSetup = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  // Simplify child mock completely
  child: jest.fn().mockReturnThis(),
  // Add level getters if needed by any code under test
  level: 'info',
  isLevelEnabled: jest.fn(level => level === 'info'), // Example implementation
};

// Mock the pino *factory function* globally. It just returns the mock instance.
// We are no longer focusing on intercepting the options passed *to* this factory.
export const actualMockPinoFactoryFnFromGlobalSetup = jest.fn(() => {
  return mockPinoInstanceFromGlobalSetup as unknown as pino.Logger; // Cast needed
});

// Mock the entire pino module to use our factory
jest.mock('pino', () => {
  console.log('GLOBAL SETUP MOCK: jest.mock for pino EXECUTED');
  return {
    __esModule: true,
    default: actualMockPinoFactoryFnFromGlobalSetup,
  };
});
// --- End Global Pino Mock ---

// Mock the Prisma client module to return our singleton mock
// IMPORTANT: Adjust the path '../../../lib/prisma' if your actual Prisma client export is located elsewhere.
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  // Mock the NAMED export 'prisma', not the default
  prisma: prismaMock,
}));

// Import the type for the actual module
// import * as ActualLoggerModule from '@/lib/logger'; // No longer needed if not using requireActual

// Mock logger globally for API tests
const mockApiLoggerInstance = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(), // Ensure child returns the same instance
  level: 'info',
  silent: jest.fn(),
  bindings: jest.fn(),
};
jest.mock('@/lib/logger', () => {
  // Explicitly type the result of requireActual
  // const actualLoggerModule = jest.requireActual('@/lib/logger') as typeof ActualLoggerModule; // REMOVED

  return {
    __esModule: true,
    // Mock base logger
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn().mockReturnThis(),
    },
    // Mock named loggers
    loggers: {
      api: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        child: jest.fn().mockReturnThis(),
      },
      auth: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        child: jest.fn().mockReturnThis(),
      },
      db: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        child: jest.fn().mockReturnThis(),
      },
      middleware: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        child: jest.fn().mockReturnThis(),
      },
      ui: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        child: jest.fn().mockReturnThis(),
      },
    },
    // Provide basic jest.fn() for previously actual implementations
    createLogger: jest.fn((_context?: Record<string, unknown> | string) => mockApiLoggerInstance), // Return a basic mock logger
    getRequestId: jest.fn(() => 'mock-request-id'), // Return a mock value
  };
});

// Wrap global hooks in a describe block for jest/require-top-level-describe
// describe('Global API Test Setup Mocks', () => {
// Set up reset of mocks for each test (globally for API tests)
beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  // Reset the global logger mock's methods
  Object.values(mockApiLoggerInstance).forEach(mockFn => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
  // Ensure child keeps returning itself after clear
  mockApiLoggerInstance.child.mockReturnThis();
  // Add any other per-test setup for mocks
});
// });

// Note: In Jest setup files, you don't need to wrap everything in a describe block
// This file is for global setup actions, not for containing tests

// --- Optional mock setup was removed --- //
