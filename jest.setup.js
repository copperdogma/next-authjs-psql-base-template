// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';

// Enable experimental features for ESM
process.env.EXPERIMENTAL_VM_MODULES = 'true';

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
