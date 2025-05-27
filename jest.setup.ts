// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import path from 'path';

import dotenv from 'dotenv';
import { defaultFallbackInView } from 'react-intersection-observer';
import { TextEncoder, TextDecoder } from 'util';

import { resetPrismaMock } from './tests/mocks/db/prismaMocks';
// Firebase mock imports removed
// import { resetFirebaseAdminMocks } from './tests/mocks/firebase/adminMocks';
// import { resetFirebaseClientMocks } from './tests/mocks/firebase/clientMocks';

// process.env.NODE_ENV = 'test'; // This is usually set by the test runner script (e.g., cross-env)
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.ALLOW_TEST_ENDPOINTS = 'true';
// process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'; // Removed

// Optional: Load environment variables from .env.test if it exists
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
} catch {
  // console.warn('Warning: Could not load .env.test file');
}

// Set IS_REACT_ACT_ENVIRONMENT to true for React 18+ compatibility with testing-library
(global as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

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

// Mock next/router
jest.mock('next/router', () => require('next-router-mock'));

// Mock next/navigation for App Router (placeholders, customize as needed)
jest.mock('next/navigation', () => ({
  useRouter: () => require('next-router-mock').useRouter(),
  usePathname: jest.fn().mockReturnValue('/mock-pathname'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  useParams: jest.fn().mockReturnValue({}),
  redirect: jest.fn(),
  permanentRedirect: jest.fn(),
  notFound: jest.fn(),
}));

// Suppress specific console errors/warnings during tests if necessary
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const firstArg = args.length > 0 ? args[0] : '';
  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('The current testing environment is not configured to support act(...)') ||
      firstArg.includes('Warning: An update to %s inside a test was not wrapped in act(...).'))
  ) {
    return; // Suppress these specific act-related warnings
  }
  originalConsoleError(...args);
};

// JSDOM-specific mocks - only apply if window is defined
if (typeof window !== 'undefined') {
  // Mock IntersectionObserver for components that use it
  // Define a class that implements the basic interface we need
  class MockIntersectionObserver {
    constructor() {}

    disconnect(): null {
      return null;
    }

    observe(): null {
      return null;
    }

    takeRecords(): [] {
      return [];
    }

    unobserve(): null {
      return null;
    }
  }

  (global as unknown as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver;

  // Mock window.matchMedia, often used for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Default intersection to `false` so that components relying on it
  // don't unexpectedly trigger state updates during tests.
  defaultFallbackInView(false);
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  // resetFirebaseClientMocks(); // Removed
  // resetFirebaseAdminMocks(); // Removed
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
