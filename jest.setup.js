// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
const DEFAULT_ENV = {
  NODE_ENV: 'test',
  EXPERIMENTAL_VM_MODULES: 'true',
  NEXTAUTH_SECRET: 'test-secret-key',
  ALLOW_TEST_ENDPOINTS: 'true',
  FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
};

// Setup the default environment
const originalEnv = { ...process.env };
Object.keys(DEFAULT_ENV).forEach(key => {
  process.env[key] = DEFAULT_ENV[key];
});

// Helper to reset environment between tests
global.resetTestEnv = () => {
  Object.keys(DEFAULT_ENV).forEach(key => {
    process.env[key] = DEFAULT_ENV[key];
  });
};

// Helper to mock environment variables temporarily
global.withMockedEnv = async (mockEnv, callback) => {
  const originalValues = {};

  // Save original values
  Object.keys(mockEnv).forEach(key => {
    originalValues[key] = process.env[key];
    process.env[key] = mockEnv[key];
  });

  try {
    // Run the callback with mocked environment
    return await callback();
  } finally {
    // Restore original values
    Object.keys(mockEnv).forEach(key => {
      if (originalValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValues[key];
      }
    });
  }
};

// Restore original environment after all tests
afterAll(() => {
  Object.keys(process.env).forEach(key => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  });
});

// Mock window.matchMedia only in jsdom environment
if (typeof window !== 'undefined') {
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
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  global.resetTestEnv();
});

// Throw errors when a `console.error` or `console.warn` happens
// by overriding the functions.
// See: https://www.benmvp.com/blog/catch-warnings-jest-tests/

const CONSOLE_FAIL_TYPES = ['error', 'warn'];

CONSOLE_FAIL_TYPES.forEach(type => {
  // eslint-disable-next-line no-console
  const originalConsole = console[type]; // Store original console method

  // eslint-disable-next-line no-console
  console[type] = (...args) => {
    // Allow specific warnings/errors if needed in the future by checking args[0]
    // Example: if (typeof args[0] === 'string' && args[0].includes('Specific warning to ignore')) {
    //   originalConsole(...args); // Log without failing
    //   return;
    // }

    // The actual console call (or throw) happens here
    throw new Error(
      `Failing test due to unexpected console.${type} call.\n\n${args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
        .join(' ')}`
    );
  };

  // Restore original console methods after all tests are done (optional but good practice)
  // Note: This might require jest.restoreAllMocks() or similar depending on exact setup
  // For simplicity in this initial implementation, we'll rely on Jest test isolation.
});
