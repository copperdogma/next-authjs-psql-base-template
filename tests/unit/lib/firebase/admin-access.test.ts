/**
 * Tests for Firebase Admin Access module
 */
import { jest } from '@jest/globals';

// 1. Setup static mock values first
const MOCK_APP_NAME = 'test-firebase-admin-app';

// Create shared mocks
const mockAuth = { getUser: jest.fn() };
const mockApp = {
  name: MOCK_APP_NAME,
  auth: jest.fn(() => mockAuth),
};
const mockAppsList = [] as any[];

// Store global state in a private scope variable that can be manipulated
let globalAppInstance: any = undefined;

// Create pre-defined mock functions for consistent access
const mockGetGlobalFn = jest.fn(() => ({
  get appInstance() {
    return globalAppInstance;
  },
  set appInstance(val) {
    globalAppInstance = val;
  },
  isInitializing: false,
  config: undefined,
  lock: null,
}));

const mockTryGetAuthFn = jest.fn(app => (app === mockApp ? mockAuth : undefined));

// 2. Define module mocks
jest.mock('@/lib/firebase/admin-types', () => ({
  UNIQUE_FIREBASE_ADMIN_APP_NAME: MOCK_APP_NAME,
}));

jest.mock('firebase-admin', () => {
  // Need to return an object where apps has all the proper array methods
  const mockApps = [] as any[];

  return {
    // Using get accessor to ensure apps is always the current mockAppsList
    get apps() {
      return mockAppsList;
    },
    app: jest.fn((name?: string) => {
      if (!name || name === MOCK_APP_NAME) return mockApp;
      throw new Error(`App not found: ${name}`);
    }),
  };
});

jest.mock('@/lib/firebase/admin-utils', () => ({
  getFirebaseAdminGlobal: mockGetGlobalFn,
  tryGetAuth: mockTryGetAuthFn,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

// 3. Import modules being tested
import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { getFirebaseAdminApp, getFirebaseAdminAuth } from '@/lib/firebase/admin-access';

// 4. Tests
describe('Firebase Admin Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset shared state
    globalAppInstance = undefined;
    mockAppsList.length = 0;

    // Reset mocks to their default implementations
    mockTryGetAuthFn.mockImplementation(app => (app === mockApp ? mockAuth : undefined));
  });

  describe('getFirebaseAdminApp', () => {
    it('returns app and auth when found in global', () => {
      // Setup
      globalAppInstance = mockApp;

      // Act
      const result = getFirebaseAdminApp();

      // Assert
      expect(mockGetGlobalFn).toHaveBeenCalled();
      expect(result.app).toBe(mockApp);
      expect(result.auth).toBe(mockAuth);
      expect(result.error).toBeUndefined();
    });

    it('returns app with error if auth retrieval fails', () => {
      // Setup
      globalAppInstance = mockApp;
      mockTryGetAuthFn.mockReturnValueOnce(undefined);

      // Act
      const result = getFirebaseAdminApp();

      // Assert
      expect(result.app).toBe(mockApp);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from existing global app.');
    });

    it('recovers app from admin.apps if not in global', () => {
      // Setup - ensure app is in admin.apps but not in global
      mockAppsList.push(mockApp);
      globalAppInstance = undefined;

      // Act
      const result = getFirebaseAdminApp();

      // Assert
      expect(mockGetGlobalFn).toHaveBeenCalled();
      expect(result.app).toBeDefined();
      expect(result.auth).toBeDefined();

      // Verify the app was stored in global
      expect(globalAppInstance).toBe(mockApp);
    });

    it('returns error if app not found anywhere', () => {
      // Setup - ensure app is neither in global nor in admin.apps
      globalAppInstance = undefined;
      mockAppsList.length = 0;

      // Act
      const result = getFirebaseAdminApp();

      // Assert
      expect(result.app).toBeUndefined();
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe(
        'Firebase Admin App not initialized or unrecoverable. Call initializeFirebaseAdmin first.'
      );
    });
  });

  describe('getFirebaseAdminAuth', () => {
    it('returns auth when available', () => {
      // Setup
      globalAppInstance = mockApp;

      // Act
      const auth = getFirebaseAdminAuth();

      // Assert
      expect(auth).toBe(mockAuth);
    });

    it('returns undefined if app not found', () => {
      // Setup
      globalAppInstance = undefined;
      mockAppsList.length = 0;

      // Act
      const auth = getFirebaseAdminAuth();

      // Assert
      expect(auth).toBeUndefined();
    });

    it('returns undefined if auth service missing', () => {
      // Setup
      globalAppInstance = mockApp;
      mockTryGetAuthFn.mockReturnValueOnce(undefined);

      // Act
      const auth = getFirebaseAdminAuth();

      // Assert
      expect(auth).toBeUndefined();
    });
  });
});
