/**
 * Tests for Firebase Admin Access module
 */
import { jest } from '@jest/globals';
import * as admin from 'firebase-admin';
import { getFirebaseAdminApp, getFirebaseAdminAuth } from '@/lib/firebase/admin-access';
import { getFirebaseAdminGlobal, tryGetAuth } from '@/lib/firebase/admin-utils';
import { logger } from '@/lib/logger';
import { UNIQUE_FIREBASE_ADMIN_APP_NAME } from '@/lib/firebase/admin-types';

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
  // const mockApps = [] as any[]; // This was causing TS6133

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
// import * as admin from 'firebase-admin';
// import { logger } from '@/lib/logger';

// Mocks
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/firebase/admin-utils', () => ({
  getFirebaseAdminGlobal: jest.fn(),
  tryGetAuth: jest.fn(),
}));

const MOCK_APP_INSTANCE = {
  name: UNIQUE_FIREBASE_ADMIN_APP_NAME,
} as any as admin.app.App; // Cast to any first to satisfy complex type for mocking

const MOCK_AUTH_INSTANCE = {} as admin.auth.Auth;

describe('Firebase Admin Access', () => {
  let mockGlobalState: { appInstance: admin.app.App | null | undefined };
  let adminAppsSpy: any; // Use 'any' to bypass SpyInstance type issues
  let getFirebaseAdminAppInternalSpy: any; // Use 'any' for the same reason

  beforeEach(() => {
    jest.clearAllMocks();
    mockGlobalState = { appInstance: undefined };
    (getFirebaseAdminGlobal as jest.Mock).mockReturnValue(mockGlobalState);
    adminAppsSpy = jest.spyOn(admin, 'apps', 'get').mockReturnValue([]);

    // Reset shared state
    globalAppInstance = undefined;
    mockAppsList.length = 0;

    // Reset mocks to their default implementations
    mockTryGetAuthFn.mockImplementation(app => (app === mockApp ? mockAuth : undefined));
  });

  afterEach(() => {
    adminAppsSpy.mockRestore(); // Ensures spy is restored after each test
    if (getFirebaseAdminAppInternalSpy) {
      getFirebaseAdminAppInternalSpy.mockRestore();
    }
  });

  describe('getFirebaseAdminApp', () => {
    it('should return app and auth if found in global state', () => {
      mockGlobalState.appInstance = MOCK_APP_INSTANCE;
      (tryGetAuth as jest.Mock).mockReturnValue(MOCK_AUTH_INSTANCE);

      const result = getFirebaseAdminApp();

      expect(result.app).toBe(MOCK_APP_INSTANCE);
      expect(result.auth).toBe(MOCK_AUTH_INSTANCE);
      expect(result.error).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        '[getFirebaseAdminApp] Attempting to retrieve app and auth from global.'
      );
      expect(logger.info).toHaveBeenCalledWith(
        `[getFirebaseAdminApp] Found app in global: ${MOCK_APP_INSTANCE.name}. Attempting to get auth.`
      );
      expect(tryGetAuth).toHaveBeenCalledWith(MOCK_APP_INSTANCE);
    });

    it('should return app and error if app in global state but auth fails', () => {
      mockGlobalState.appInstance = MOCK_APP_INSTANCE;
      (tryGetAuth as jest.Mock).mockReturnValue(undefined);

      const result = getFirebaseAdminApp();

      expect(result.app).toBe(MOCK_APP_INSTANCE);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from existing global app.');
    });

    it('should recover app from admin.apps if not in global and cache it', () => {
      adminAppsSpy.mockReturnValue([MOCK_APP_INSTANCE]);
      (tryGetAuth as jest.Mock).mockReturnValue(MOCK_AUTH_INSTANCE);

      const result = getFirebaseAdminApp();

      expect(result.app).toBe(MOCK_APP_INSTANCE);
      expect(result.auth).toBe(MOCK_AUTH_INSTANCE);
      expect(result.error).toBeUndefined();
      expect(mockGlobalState.appInstance).toBe(MOCK_APP_INSTANCE);
      expect(logger.warn).toHaveBeenCalledWith(
        '[getFirebaseAdminApp] Firebase Admin app instance not found via global. Attempting SDK recovery.'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `[getFirebaseAdminApp] Recovered app by unique name '${UNIQUE_FIREBASE_ADMIN_APP_NAME}' from SDK. Caching it globally.`,
        { appName: MOCK_APP_INSTANCE.name }
      );
    });

    it('should return recovered app and error if auth fails after recovery', () => {
      adminAppsSpy.mockReturnValue([MOCK_APP_INSTANCE]);
      (tryGetAuth as jest.Mock).mockReturnValue(undefined);

      const result = getFirebaseAdminApp();

      expect(result.app).toBe(MOCK_APP_INSTANCE);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from recovered SDK app.');
      expect(mockGlobalState.appInstance).toBe(MOCK_APP_INSTANCE);
    });

    it('should return error if app not found globally or in admin.apps (empty admin.apps)', () => {
      const result = getFirebaseAdminApp();

      expect(result.app).toBeUndefined();
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe(
        'Firebase Admin App not initialized or unrecoverable. Call initializeFirebaseAdmin first.'
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[getFirebaseAdminApp] Firebase Admin app instance not found globally or by unique name in SDK registry.',
        { appNameSearched: UNIQUE_FIREBASE_ADMIN_APP_NAME }
      );
    });

    it('should handle admin.apps being null or undefined (from spy) safely during recovery attempt', () => {
      adminAppsSpy.mockReturnValue(null);
      let result = getFirebaseAdminApp();
      expect(result.error).toBeDefined();
      expect(result.app).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        '[getFirebaseAdminApp] Firebase Admin app instance not found via global. Attempting SDK recovery.'
      );

      mockGlobalState.appInstance = undefined;
      (getFirebaseAdminGlobal as jest.Mock).mockReturnValue(mockGlobalState);

      adminAppsSpy.mockReturnValue(undefined);
      result = getFirebaseAdminApp();
      expect(result.error).toBeDefined();
      expect(result.app).toBeUndefined();
    });

    it('should handle app in admin.apps not matching UNIQUE_FIREBASE_ADMIN_APP_NAME', () => {
      const otherApp = { name: 'other-app-name' } as any as admin.app.App;
      adminAppsSpy.mockReturnValue([otherApp]);
      const result = getFirebaseAdminApp();
      expect(result.error).toBeDefined();
      expect(result.app).toBeUndefined();
    });
  });

  describe('getFirebaseAdminAuth', () => {
    it('should return auth if getFirebaseAdminApp returns app and auth', () => {
      mockGlobalState.appInstance = MOCK_APP_INSTANCE;
      (tryGetAuth as jest.Mock).mockReturnValue(MOCK_AUTH_INSTANCE);
      expect(getFirebaseAdminAuth()).toBe(MOCK_AUTH_INSTANCE);
    });

    it('should return undefined if getFirebaseAdminApp returns an error', () => {
      expect(getFirebaseAdminAuth()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[getFirebaseAdminAuth] Could not get Firebase Auth service due to: Firebase Admin App not initialized or unrecoverable.'
        )
      );
    });

    it('should return undefined if getFirebaseAdminApp returns app but no auth (and an error)', () => {
      mockGlobalState.appInstance = MOCK_APP_INSTANCE;
      (tryGetAuth as jest.Mock).mockReturnValue(undefined);
      expect(getFirebaseAdminAuth()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        `[getFirebaseAdminAuth] Could not get Firebase Auth service due to: Failed to retrieve auth from existing global app. App state: ${MOCK_APP_INSTANCE.name}`
      );
    });

    it('should return undefined and log if app exists but auth is undefined without an error string', () => {
      getFirebaseAdminAppInternalSpy = jest
        .spyOn(require('@/lib/firebase/admin-access'), 'getFirebaseAdminApp')
        .mockReturnValueOnce({ app: MOCK_APP_INSTANCE, auth: undefined });

      expect(getFirebaseAdminAuth()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        `[getFirebaseAdminAuth] App '${MOCK_APP_INSTANCE.name}' was found, but its Auth service could not be retrieved.`
      );
    });

    it('should return undefined and log if neither app nor auth could be retrieved', () => {
      getFirebaseAdminAppInternalSpy = jest
        .spyOn(require('@/lib/firebase/admin-access'), 'getFirebaseAdminApp')
        .mockReturnValueOnce({ auth: undefined });

      expect(getFirebaseAdminAuth()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        '[getFirebaseAdminAuth] Neither App nor Auth service could be retrieved.'
      );
    });
  });
});
