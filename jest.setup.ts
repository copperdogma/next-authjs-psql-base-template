// Generic setup file for both Node.js and JSDOM environments
import path from 'path';
import dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';
import { resetPrismaMock } from './tests/mocks/db/prismaMocks';

// Environment configuration
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.ALLOW_TEST_ENDPOINTS = 'true';

// Optional: Load environment variables from .env.test if it exists
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
} catch {
  // console.warn('Warning: Could not load .env.test file');
}

// Mock TextEncoder and TextDecoder which are not available in JSDOM by default
// These are often used by libraries like next-auth or other crypto-related functions
// Check if they are already defined to avoid overwriting if tests run in a different env (e.g. node)
// Use unknown instead of any to avoid the no-explicit-any eslint rule
if (typeof (global as unknown as Record<string, unknown>).TextEncoder === 'undefined') {
  (global as unknown as Record<string, unknown>).TextEncoder = TextEncoder;
}
if (typeof (global as unknown as Record<string, unknown>).TextDecoder === 'undefined') {
  (global as unknown as Record<string, unknown>).TextDecoder = TextDecoder;
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  jest.restoreAllMocks();
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
