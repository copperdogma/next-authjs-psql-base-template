/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

// We'll use these variables to hold our mocks
let mockApps: any[] = [];
let mockInitializeAppCalls: any[] = [];
let mockCredentialCertCalls: any[] = [];

// Mock initialize app function that records calls
const mockInitializeApp = jest.fn().mockImplementation(config => {
  mockInitializeAppCalls.push(config);
  const mockApp = { name: 'mockApp', options: config };
  mockApps.push(mockApp);
  return mockApp;
});

// Mock credential cert function that records calls
const mockCredentialCert = jest.fn().mockImplementation((serviceAccount: any) => {
  mockCredentialCertCalls.push(serviceAccount);
  return { type: 'cert', ...serviceAccount };
});

const mockAuth = jest.fn().mockImplementation(() => {
  return {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    createCustomToken: jest.fn(),
  };
});

// Set up the mock before all tests
jest.mock('firebase-admin', () => {
  return {
    initializeApp: mockInitializeApp,
    get apps() {
      return mockApps;
    },
    credential: {
      cert: mockCredentialCert,
    },
    auth: mockAuth,
  };
});

// Mock the logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

jest.mock('../../../lib/logger', () => ({
  logger: mockLogger,
}));

describe('initializeFirebaseAdminApp', () => {
  // Store original env variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks and environment variables before each test
    jest.clearAllMocks();
    mockApps = []; // Reset the apps array
    mockInitializeAppCalls = []; // Reset recorded calls
    mockCredentialCertCalls = []; // Reset recorded calls
    process.env = { ...originalEnv }; // Restore original env

    // Reset the module registry to ensure fresh imports in each test
    jest.resetModules();
  });

  afterAll(() => {
    // Restore original environment after all tests
    process.env = originalEnv;
  });

  it('should initialize with credentials when not using emulators', async () => {
    // Setup environment - making sure all emulator flags are disabled
    process.env.FIREBASE_PROJECT_ID = 'prod-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'prod@example.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nprod_key\\n-----END PRIVATE KEY-----';
    delete process.env.USE_FIREBASE_EMULATOR;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Import the module
    const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');

    // Call the function
    initializeFirebaseAdminApp();

    // Verify the credential cert was called with correct args
    expect(mockCredentialCert).toHaveBeenCalled();
    expect(mockCredentialCertCalls.length).toBe(1);
    expect(mockCredentialCertCalls[0]).toHaveProperty('projectId', 'prod-project');
    expect(mockCredentialCertCalls[0]).toHaveProperty('clientEmail', 'prod@example.com');
    expect(mockCredentialCertCalls[0]).toHaveProperty(
      'privateKey',
      '-----BEGIN PRIVATE KEY-----\nprod_key\n-----END PRIVATE KEY-----'
    );

    // Verify initialize app was called with credential
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockInitializeAppCalls.length).toBe(1);
    expect(mockInitializeAppCalls[0]).toHaveProperty('credential');
  });

  it('should reuse existing app if already initialized', async () => {
    // Setup existing app
    const existingApp = { name: 'existingApp', options: {} };
    mockApps.push(existingApp);

    // Import and test
    const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');
    initializeFirebaseAdminApp();
    initializeFirebaseAdminApp();

    // Verify expectations
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      '🔸 [Admin SDK] Reusing existing Firebase Admin App instance.'
    );
    expect(mockApps.length).toBe(1);
  });

  it('should initialize for emulator use if USE_FIREBASE_EMULATOR is true', async () => {
    // Setup
    process.env.USE_FIREBASE_EMULATOR = 'true';
    process.env.FIREBASE_PROJECT_ID = 'emulator-project';

    // Import and test
    const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');
    initializeFirebaseAdminApp();

    // Verify expectations
    expect(mockInitializeApp).toHaveBeenCalledWith({
      projectId: 'emulator-project',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      { projectId: 'emulator-project' },
      '✅ [Admin SDK] Initialized for Firebase Emulators.'
    );

    // Verify credential cert was NOT called since we're in emulator mode
    expect(mockCredentialCert).not.toHaveBeenCalled();
  });

  it('should initialize for emulator use if FIREBASE_AUTH_EMULATOR_HOST is set', async () => {
    // Setup
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    delete process.env.FIREBASE_PROJECT_ID;

    // Import and test
    const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');
    initializeFirebaseAdminApp();

    // Verify expectations
    expect(mockInitializeApp).toHaveBeenCalledWith({
      projectId: 'next-firebase-base-template-emulator',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      { projectId: 'next-firebase-base-template-emulator' },
      '✅ [Admin SDK] Initialized for Firebase Emulators.'
    );

    // Verify credential cert was NOT called since we're in emulator mode
    expect(mockCredentialCert).not.toHaveBeenCalled();
  });

  it('should throw error and log if credentials are missing in non-emulator environment', async () => {
    // Setup - remove all env vars
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.USE_FIREBASE_EMULATOR;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Expect error
    let error: Error | null = null;

    try {
      // Import and run
      const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');
      initializeFirebaseAdminApp();
    } catch (e) {
      error = e as Error;
    }

    // Check error was thrown
    expect(error).not.toBeNull();
    expect(error!.message).toBe(
      'Missing Firebase Admin SDK credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );

    // Verify logging
    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        projectId: false,
        clientEmail: false,
        privateKey: false,
      },
      '❌ [Admin SDK] Missing required Firebase Admin credentials in environment variables.'
    );
  });

  it('should handle private key formatting (no newlines)', async () => {
    // Setup environment - making sure all emulator flags are disabled
    process.env.FIREBASE_PROJECT_ID = 'format-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'format@example.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----no_newlines-----END PRIVATE KEY-----';
    delete process.env.USE_FIREBASE_EMULATOR;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Import and test
    const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');

    // Call the function
    initializeFirebaseAdminApp();

    // Verify private key formatting
    expect(mockCredentialCert).toHaveBeenCalled();
    expect(mockCredentialCertCalls.length).toBe(1);
    expect(mockCredentialCertCalls[0]).toHaveProperty(
      'privateKey',
      '-----BEGIN PRIVATE KEY-----\nno_newlines\n-----END PRIVATE KEY-----'
    );
  });

  it('should throw error if initializeApp fails with credentials', async () => {
    // Setup
    process.env.FIREBASE_PROJECT_ID = 'fail-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'fail@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'valid_key';

    // Setup error
    const initError = new Error('Firebase init failed');
    mockInitializeApp.mockImplementationOnce(() => {
      throw initError;
    });

    // Import and test
    await expect(async () => {
      const { initializeFirebaseAdminApp } = await import('../../../lib/firebase-admin');
      return initializeFirebaseAdminApp();
    }).rejects.toThrow(initError);

    // Verify logging
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: initError.message,
      }),
      '❌ [Admin SDK] Failed to initialize Firebase Admin SDK.'
    );
  });
});
