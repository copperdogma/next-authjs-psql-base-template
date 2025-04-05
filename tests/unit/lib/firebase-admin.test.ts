/**
 * @jest-environment node
 */

import * as admin from 'firebase-admin';

// Mock Firebase Admin functions
jest.mock('firebase-admin', () => {
  return {
    apps: [],
    initializeApp: jest.fn().mockReturnValue({ name: 'mocked-app' }),
    credential: {
      cert: jest.fn().mockReturnValue('mocked-cert'),
    },
    firestore: jest.fn().mockReturnValue({
      settings: jest.fn(),
    }),
  };
});

describe('Firebase Admin SDK', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset apps array before each test
    Object.defineProperty(admin, 'apps', {
      value: [],
      writable: true,
    });
    // Clear module cache for each test
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should be able to import firebase-admin module', () => {
    const firebaseAdmin = require('../../../lib/firebase-admin');
    expect(firebaseAdmin).toBeDefined();
  });

  test('should provide Firebase Admin SDK interface', () => {
    // Set required env variables
    process.env.FIREBASE_PROJECT_ID = 'test-project-id';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';

    // Import the module
    const firebaseAdmin = require('../../../lib/firebase-admin').default;

    // Verify the interface exists and is an object
    expect(firebaseAdmin).toBeDefined();
    expect(typeof firebaseAdmin).toBe('object');
  });

  test('should handle test environment', () => {
    // Set test environment
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module in test environment
    const firebaseAdmin = require('../../../lib/firebase-admin').default;

    // Verify it loads in test environment
    expect(firebaseAdmin).toBeDefined();
    expect(typeof firebaseAdmin).toBe('object');
  });
});
