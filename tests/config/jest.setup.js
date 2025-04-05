// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

import { jest } from '@jest/globals';

// Import mocks and setup utilities
import {
  mockAuth,
  mockApp,
  mockSignInWithPopup,
  mockSignOut,
  mockGoogleAuthProvider,
} from '../mocks/firebase';
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

// Mock environment variables for Firebase
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-messaging-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  GoogleAuthProvider: mockGoogleAuthProvider,
}));

// Mock Firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
}));

// Set up global mocks
global.mockAuth = mockAuth;
global.mockApp = mockApp;
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
