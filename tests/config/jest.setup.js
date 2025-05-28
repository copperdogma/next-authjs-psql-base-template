// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

import { jest } from '@jest/globals';

// Import mocks and setup utilities
import { setupBrowserMocks } from '../mocks/setup-browser-mocks';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Set up global mocks
global.fetch = jest.fn();

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Get app URL from environment or default to port 3000
const TEST_PORT = process.env.TEST_PORT || '3000';
const APP_URL = `http://localhost:${TEST_PORT}`;

// Mock window.location
delete window.location;
window.location = {
  href: APP_URL,
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  replace: jest.fn(),
  assign: jest.fn(),
};

// Setup browser API mocks from separate file
setupBrowserMocks(APP_URL);
