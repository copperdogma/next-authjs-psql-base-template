/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import * as admin from 'firebase-admin';
import * as pino from 'pino';

// --- Mocks ---
const mockInitializeApp = jest.fn();
const mockCert = jest.fn();
const mockAuthFn = jest.fn(); // Placeholder for now
const mockFirestore = jest.fn();
const mockStorage = jest.fn();
const mockAuthInstance = {
  verifyIdToken: jest.fn(),
  createUser: jest.fn() /* other methods as needed */,
};
const mockApp = {
  auth: mockAuthFn,
  firestore: mockFirestore,
  storage: mockStorage,
  name: 'mockApp',
};

let mockAdminApps: admin.app.App[] = []; // Mutable array for controlling admin.apps

// Mock the firebase-admin module
jest.mock('firebase-admin', () => ({
  initializeApp: mockInitializeApp, // Directly use the jest.fn() tracker
  credential: {
    cert: mockCert,
  },
  // Use the external mutable array here via a getter
  get apps() {
    return mockAdminApps;
  },
  app: jest.fn(() => {
    // Mock admin.app()
    if (mockAdminApps.length > 0) return mockAdminApps[0];
    throw new Error('Mock admin.app(): No default app exists.'); // Simulate error if no app
  }),
  auth: () => ({ Auth: jest.fn() }), // Placeholder
}));

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  trace: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
} as unknown as pino.Logger;

jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Import the service *after* mocks
// Adjust path if needed

describe('FirebaseAdminServiceImpl', () => {
  let service: any; // FirebaseAdminServiceImpl type will be dynamic
  const originalEnv = process.env; // Store original env

  beforeEach(() => {
    jest.resetModules(); // Reset modules
    process.env = { ...originalEnv }; // Reset env
    jest.clearAllMocks(); // Reset mocks

    // Reset firebase-admin mock states
    mockAdminApps.length = 0; // CORRECT WAY: Clear the external mutable array

    mockInitializeApp.mockReturnValue(mockApp); // initializeApp returns our mockApp
    mockAuthFn.mockReturnValue(mockAuthInstance); // app.auth() (which is mockAuthFn()) returns a mock Auth instance
    mockCert.mockReturnValue({ type: 'mockCredential' }); // Default success

    // --- DEFER INSTANTIATION ---
    // service = new FirebaseAdminServiceImpl();
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  // --- Test sections will be added below ---

  it('should initialize successfully when admin.apps is empty and mocks are set up', () => {
    // Ensure admin.apps is empty as per beforeEach, or set it explicitly if needed for this test's clarity
    mockAdminApps.length = 0;
    process.env.FIREBASE_PROJECT_ID = 'test-project'; // Ensure ADC path can be taken

    // Dynamically import/require the service *here* to ensure it gets the latest mocks/env
    const { FirebaseAdminServiceImpl } = require('@/lib/server/services/firebase-admin.service');

    service = new FirebaseAdminServiceImpl();
    expect(service.isInitialized()).toBe(true);

    // Optionally, check that initializeApp was called
    // This depends on how deep we want to test the mock interactions.
    // Given the current mock for initializeApp, this should pass.
    expect(mockInitializeApp).toHaveBeenCalled();

    // Check if the service's internal app is set
    // This requires exposing the app or having a method that uses it.
    // For now, isInitialized() is a good public API check.
    // We can also check if getAuth() doesn't throw, implying initialization.
    expect(() => service.getAuth()).not.toThrow();
    expect(service.getAuth()).toBeDefined(); // Relies on mockApp.auth being truthy
  });

  // Placeholder for old tests structure - will be removed/refactored
  it('placeholder test to avoid empty suite', () => {
    expect(true).toBe(true);
  });
});

// --- Remove old describe blocks and tests related to createTestInstance ---
