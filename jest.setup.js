// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_PWA_APP_NAME = 'test-app';
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
