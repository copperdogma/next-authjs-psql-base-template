import * as admin from 'firebase-admin';
// import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin'; // Removed unused import
import { logger } from '@/lib/logger';

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  app: jest.fn(),
  apps: [],
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

const mockInitializeApp = admin.initializeApp as jest.Mock;
const mockAppFn = admin.app as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

describe('Firebase Admin SDK Initialization (getFirebaseAdminApp)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Crucial to reset module cache for env variable changes and SUT's internal 'app' variable
    // Import getFirebaseAdminApp dynamically AFTER resetting modules and setting up mocks/env vars for the specific test
    // This ensures the SUT sees the correct state for each test.
    process.env = { ...originalEnv };
    mockInitializeApp.mockClear();
    mockAppFn.mockClear();
    mockLoggerError.mockClear();
    // (admin.apps as any) = []; // SUT does not use admin.apps directly for singleton logic, uses module-scoped `app`
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env after all tests
  });

  it('should initialize and return a new app if none exists', () => {
    // Arrange
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test-client-email@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

    const mockFbApp = { name: '__DEFAULT__' } as admin.app.App;
    let appInstance: admin.app.App | undefined;
    let localMockInitializeApp!: jest.Mock;
    let localMockCredentialCert!: jest.Mock;

    // Act: Use jest.isolateModules and jest.doMock to ensure fresh SUT and firebase-admin mock
    jest.isolateModules(() => {
      localMockInitializeApp = jest.fn().mockReturnValue(mockFbApp);
      localMockCredentialCert = jest.fn().mockReturnValue({ type: 'mocked-cert-isolated' });

      jest.doMock('firebase-admin', () => ({
        initializeApp: localMockInitializeApp,
        credential: {
          cert: localMockCredentialCert,
        },
        app: jest.fn(),
        apps: [],
      }));

      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');
      appInstance = getFirebaseAdminAppSUT();

      // Assertions related to mocks defined and used within this isolated scope
      expect(localMockInitializeApp).toHaveBeenCalledTimes(1);
      expect(localMockInitializeApp).toHaveBeenCalledWith({
        credential: { type: 'mocked-cert-isolated' },
      });
      expect(localMockCredentialCert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test-client-email@example.com',
        privateKey: 'test-private-key'.replace(/\\n/g, '\n'),
      });
    });

    // Assertions related to the outcome (appInstance)
    expect(appInstance).toBe(mockFbApp);
  });

  it('should return the same app instance if called multiple times (singleton behavior)', () => {
    // Arrange
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test-client-email@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

    const mockFbApp = { name: '__DEFAULT__' } as admin.app.App;
    let app1: admin.app.App | undefined;
    let app2: admin.app.App | undefined;
    let localMockInitializeApp!: jest.Mock;
    let localMockCredentialCert!: jest.Mock;

    // Act: Use jest.isolateModules for the SUT calls
    jest.isolateModules(() => {
      localMockInitializeApp = jest.fn().mockReturnValue(mockFbApp);
      localMockCredentialCert = jest
        .fn()
        .mockReturnValue({ type: 'mocked-cert-isolated-singleton' });

      jest.doMock('firebase-admin', () => ({
        initializeApp: localMockInitializeApp,
        credential: {
          cert: localMockCredentialCert,
        },
        app: jest.fn(),
        apps: [],
      }));

      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');
      app1 = getFirebaseAdminAppSUT();
      app2 = getFirebaseAdminAppSUT(); // Call SUT again within the same isolated context

      // Assertions for mocks within this scope
      expect(localMockInitializeApp).toHaveBeenCalledTimes(1); // Should only initialize once
      expect(localMockCredentialCert).toHaveBeenCalledTimes(1); // Cert should also be called once
    });

    // Assertions for the outcome
    expect(app1).toBe(mockFbApp);
    expect(app2).toBe(app1); // Should return the same instance
  });

  it('should throw specific error and log if FIREBASE_PROJECT_ID is missing', () => {
    // Arrange
    delete process.env.FIREBASE_PROJECT_ID;
    process.env.FIREBASE_CLIENT_EMAIL = 'test-client-email@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

    // Act & Assert: Use jest.isolateModules
    jest.isolateModules(() => {
      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');
      expect(() => getFirebaseAdminAppSUT()).toThrow(
        'FIREBASE_PROJECT_ID is not set in environment variables.'
      );
    });
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('should throw specific error and log if FIREBASE_CLIENT_EMAIL is missing', () => {
    // Arrange
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    delete process.env.FIREBASE_CLIENT_EMAIL;
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

    // Act & Assert: Use jest.isolateModules
    jest.isolateModules(() => {
      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');
      expect(() => getFirebaseAdminAppSUT()).toThrow(
        'FIREBASE_CLIENT_EMAIL is not set in environment variables.'
      );
    });
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('should throw specific error and log if FIREBASE_PRIVATE_KEY is missing', () => {
    // Arrange
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test-client-email@example.com';
    delete process.env.FIREBASE_PRIVATE_KEY;

    // Act & Assert: Use jest.isolateModules
    jest.isolateModules(() => {
      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');
      expect(() => getFirebaseAdminAppSUT()).toThrow(
        'FIREBASE_PRIVATE_KEY is not set in environment variables.'
      );
    });
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('should log and throw a generic error if admin.initializeApp fails', () => {
    // Arrange
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test-client-email@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

    const initializationError = new Error('Firebase init failed internally');
    let localMockInitializeApp!: jest.Mock;
    let localMockCredentialCert!: jest.Mock;

    // Act & Assert: Use jest.isolateModules
    jest.isolateModules(() => {
      localMockInitializeApp = jest.fn().mockImplementation(() => {
        throw initializationError;
      });
      localMockCredentialCert = jest.fn().mockReturnValue({ type: 'mocked-cert-isolated-error' });

      jest.doMock('firebase-admin', () => ({
        initializeApp: localMockInitializeApp,
        credential: {
          cert: localMockCredentialCert,
        },
        app: jest.fn(),
        apps: [],
      }));

      // Dynamically import SUT within the isolated scope
      const {
        getFirebaseAdminApp: getFirebaseAdminAppSUT,
      } = require('@/lib/firebase/firebase-admin');

      // Assert that the SUT call throws the expected error
      expect(() => getFirebaseAdminAppSUT()).toThrow(
        'Could not initialize Firebase Admin SDK. Check server logs for details.'
      );

      // Verify that the local mocks were called as expected before the throw
      expect(localMockInitializeApp).toHaveBeenCalledTimes(1);
      expect(localMockCredentialCert).toHaveBeenCalledTimes(1); // admin.credential.cert is called before initializeApp

      // Get the logger mock as used by the SUT in this isolated context and assert it was called
      const { logger: isolatedSutLogger } = require('@/lib/logger');
      const isolatedMockLoggerError = isolatedSutLogger.error as jest.Mock;
      expect(isolatedMockLoggerError).toHaveBeenCalledTimes(1);
      expect(isolatedMockLoggerError).toHaveBeenCalledWith(
        { err: initializationError },
        'Firebase Admin SDK initialization failed'
      );
    });

    // The global mockLoggerError assertion is no longer needed here as we check the isolated one.
    // expect(mockLoggerError).toHaveBeenCalledWith({ err: initializationError }, 'Firebase Admin SDK initialization failed');
  });

  // Add more tests if there are other nuanced behaviors, e.g. handling of initializeApp errors
});
