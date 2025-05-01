import { jest } from '@jest/globals';
import { prismaMock, resetPrismaMock } from '../../mocks/db/prisma-mock'; // Adjust path if needed

// Mock the Prisma client module to return our singleton mock
// IMPORTANT: Adjust the path '../../../lib/prisma' if your actual Prisma client export is located elsewhere.
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  // Mock the NAMED export 'prisma', not the default
  prisma: prismaMock,
}));

// Import the type for the actual module
import * as ActualLoggerModule from '@/lib/logger';

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
  const actualLoggerModule = jest.requireActual('@/lib/logger') as typeof ActualLoggerModule;

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
    // Export ACTUAL implementations using the typed variable
    createLogger: actualLoggerModule.createLogger,
    getRequestId: actualLoggerModule.getRequestId,
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

// --- Optional mock setup for Firebase Admin --- //
// jest.mock('@/lib/firebase-admin', () => ({
//   auth: jest.fn(),
//   firestore: jest.fn(),
//   // Add other Firebase Admin services you use
// }));
