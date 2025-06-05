// JSDOM-specific setup for browser-like environment tests
import '@testing-library/jest-dom';
import { defaultFallbackInView } from 'react-intersection-observer';

// Set IS_REACT_ACT_ENVIRONMENT to true for React 18+ compatibility with testing-library
(global as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Mock next/router - only needed in JSDOM environment
jest.mock('next/router', () => require('next-router-mock'));

// Mock next/navigation for App Router
jest.mock('next/navigation', () => ({
  useRouter: () => require('next-router-mock').useRouter(),
  usePathname: jest.fn().mockReturnValue('/mock-pathname'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  useParams: jest.fn().mockReturnValue({}),
  redirect: jest.fn(),
  permanentRedirect: jest.fn(),
  notFound: jest.fn(),
}));

// JSDOM-specific mocks
// Mock IntersectionObserver for components that use it
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
