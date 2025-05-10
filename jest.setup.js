// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import path from 'path';

import dotenv from 'dotenv';

import { resetPrismaMock } from './tests/mocks/db/prismaMocks';
import { resetFirebaseAdminMocks } from './tests/mocks/firebase/adminMocks';
import { resetFirebaseClientMocks } from './tests/mocks/firebase/clientMocks';

// Basic setup for mock environment
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.ALLOW_TEST_ENDPOINTS = 'true';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Optional: Load environment variables from .env.test if it exists
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
} catch (error) {
  // console.warn('Warning: Could not load .env.test file'); // Intentionally removed to satisfy linter
}

// Polyfill for TextEncoder and TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock window.matchMedia only in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  resetFirebaseClientMocks();
  resetFirebaseAdminMocks();
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
