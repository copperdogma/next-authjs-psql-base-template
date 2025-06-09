// Generic setup file for both Node.js and JSDOM environments
import path from 'path';
import dotenv from 'dotenv';
import '@testing-library/jest-dom';
import { resetPrismaMock } from './__mocks__/db/prismaMocks';

// Environment configuration
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.ALLOW_TEST_ENDPOINTS = 'true';

// Optional: Load environment variables from .env.test if it exists
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
} catch {
  // console.warn('Warning: Could not load .env.test file');
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  jest.restoreAllMocks();
});

// Reset database mocks before each test
beforeEach(() => {
  resetPrismaMock();
});

// Comment out console overrides to help debugging
/*
const CONSOLE_FAIL_TYPES = ['error', 'warn'];
CONSOLE_FAIL_TYPES.forEach(type => {
  const originalConsole = console[type];
  console[type] = (...args) => {
    originalConsole(...args);
    throw new Error(`Unexpected console.${type} call: ${args.join(', ')}`);
  };
});
*/

// Add any global test setup here
