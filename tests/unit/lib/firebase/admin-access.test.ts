import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { getFirebaseAdminApp, getFirebaseAdminAuth } from '@/lib/firebase/admin-access';
import { getFirebaseAdminGlobal, tryGetAuth } from '@/lib/firebase/admin-utils';

// Mock @/lib/firebase/admin-types to control UNIQUE_FIREBASE_ADMIN_APP_NAME
jest.mock('@/lib/firebase/admin-types', () => ({
  ...jest.requireActual('@/lib/firebase/admin-types'),
  UNIQUE_FIREBASE_ADMIN_APP_NAME: 'mocked-app-name-for-access-tests',
}));

const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types');

// Mock firebase-admin (dependency of SUT)
// The factory function for jest.mock is executed before other module code.
// Thus, it cannot reference variables like mockFbAdminAppInstance if they are defined later using const/let.
// Define the mock structure self-containedly or use requireActual for runtime values needed by the mock.
jest.mock('firebase-admin', () => {
  // Values needed by the mock that can be determined at module load time
  const adminTypes = jest.requireActual('@/lib/firebase/admin-types'); // Get actual values for constants
  const localMockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() } as any;
  const localMockAppInstance = {
    name: adminTypes.UNIQUE_FIREBASE_ADMIN_APP_NAME, // Use the name from actual admin-types
    auth: jest.fn().mockReturnValue(localMockAuthService),
  } as unknown as admin.app.App;

  return {
    apps: [],
    initializeApp: jest.fn().mockReturnValue(localMockAppInstance),
    credential: { cert: jest.fn(), applicationDefault: jest.fn() },
    app: jest.fn(() => localMockAppInstance),
    auth: jest.fn(() => localMockAuthService),
  };
});

// Mock @/lib/firebase/admin-utils (dependency of SUT)
const mockGlobalAdminState = {
  appInstance: undefined as admin.app.App | undefined,
  isInitializing: false,
  config: undefined,
  lock: null,
};
jest.mock('@/lib/firebase/admin-utils', () => ({
  getFirebaseAdminGlobal: jest.fn().mockReturnValue(mockGlobalAdminState),
  tryGetAuth: jest.fn((app: admin.app.App | undefined) => (app ? app.auth() : undefined)),
}));

describe('Firebase Admin Access Module', () => {
  const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types');
  // Get the top-level mocked firebase-admin app instance for reference in tests, if needed
  // This needs to be robust to jest.resetModules()
  let currentMockAppInstance: admin.app.App;
  let currentMockAuthService: any;

  // Get mock functions from the mocked modules
  const mockedAdminAppFn = admin.app as jest.Mock;
  const mockedAdminAppsArray = admin.apps as admin.app.App[];
  const mockedFirebaseAdminModule = admin as any; // For referencing initializeApp etc.

  const mockUtilsGetFirebaseAdminGlobal = require('@/lib/firebase/admin-utils')
    .getFirebaseAdminGlobal as jest.Mock;
  const mockUtilsTryGetAuth = require('@/lib/firebase/admin-utils').tryGetAuth as jest.Mock;

  beforeEach(() => {
    jest.resetModules(); // This is key. It resets SUT and its cached dependencies.
    jest.clearAllMocks();

    // After resetModules, re-require SUT if its internal state relies on module-level vars post-mocking
    // For this SUT, direct import at top level should be fine if deps are correctly mocked before it.

    // Re-establish references to the *current* mocks after resetModules might have changed them
    // The factory for firebase-admin mock creates new instances each time it's evaluated by Jest.
    currentMockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() };
    currentMockAppInstance = {
      name: adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME,
      auth: jest.fn().mockReturnValue(currentMockAuthService),
    } as unknown as admin.app.App;

    // Configure the *live* mocks from the 'firebase-admin' module that jest is now using for this test run
    (mockedFirebaseAdminModule.initializeApp as jest.Mock).mockReturnValue(currentMockAppInstance);
    (mockedFirebaseAdminModule.app as jest.Mock).mockReturnValue(currentMockAppInstance);
    (mockedFirebaseAdminModule.auth as jest.Mock).mockReturnValue(currentMockAuthService);
    (currentMockAppInstance.auth as jest.Mock).mockReturnValue(currentMockAuthService);
    while (mockedAdminAppsArray.length > 0) mockedAdminAppsArray.pop(); // Clear admin.apps

    // Reset and reconfigure admin-utils mocks
    mockGlobalAdminState.appInstance = undefined;
    mockGlobalAdminState.isInitializing = false;
    mockGlobalAdminState.config = undefined;
    mockGlobalAdminState.lock = null;
    mockUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminState);
    mockUtilsTryGetAuth.mockImplementation((app: admin.app.App | undefined) =>
      app ? app.auth() : undefined
    );
  });

  describe('getFirebaseAdminApp', () => {
    it('should return app and auth from global if appInstance exists and auth is retrieved', () => {
      mockGlobalAdminState.appInstance = currentMockAppInstance;
      mockUtilsTryGetAuth.mockReturnValue(currentMockAuthService);

      const result = getFirebaseAdminApp();

      expect(mockUtilsGetFirebaseAdminGlobal).toHaveBeenCalled();
      expect(result.app).toBe(currentMockAppInstance);
      expect(result.auth).toBe(currentMockAuthService);
      expect(result.error).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        '[Firebase Admin Access] Found app in global:',
        currentMockAppInstance.name
      );
    });

    it('should return app with error if global appInstance exists but auth retrieval fails', () => {
      mockGlobalAdminState.appInstance = currentMockAppInstance;
      mockUtilsTryGetAuth.mockReturnValue(undefined);

      const result = getFirebaseAdminApp();

      expect(result.app).toBe(currentMockAppInstance);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from existing global app.');
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Admin Access] App found in global, but failed to retrieve auth.',
        currentMockAppInstance.name
      );
    });

    it('should attempt to recover app from admin.apps if not found in global and succeed if present', () => {
      mockedAdminAppsArray.push(currentMockAppInstance);
      // Ensure admin.app(name) will find it from the array
      (mockedFirebaseAdminModule.app as jest.Mock).mockImplementation(appName => {
        if (appName === adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME)
          return currentMockAppInstance;
        throw new Error('App not found by name in admin.app mock');
      });
      mockUtilsTryGetAuth.mockReturnValue(currentMockAuthService);

      const result = getFirebaseAdminApp();

      expect(mockUtilsGetFirebaseAdminGlobal).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Admin Access] App not found via global. Attempting recovery from admin.apps with name:',
        adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      expect(mockedFirebaseAdminModule.app).toHaveBeenCalledWith(
        adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      expect(result.app).toBe(currentMockAppInstance);
      expect(result.auth).toBe(currentMockAuthService);
      expect(logger.info).toHaveBeenCalledWith(
        '[Firebase Admin Access] Recovered app by unique name:',
        currentMockAppInstance.name
      );
    });

    it('should return error if app not in global and recovery from admin.apps fails', () => {
      (mockedFirebaseAdminModule.app as jest.Mock).mockImplementation(() => {
        throw new Error('Mocked: App not found in admin.apps');
      });

      const result = getFirebaseAdminApp();

      expect(result.app).toBeUndefined();
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe(
        'Firebase Admin App not initialized or unrecoverable. Call initializeFirebaseAdmin first.'
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[Firebase Admin Access] CRITICAL: App not found in global or via admin.apps recovery.',
        expect.any(Error)
      );
    });
  });

  describe('getFirebaseAdminAuth', () => {
    it('should return auth if app is successfully retrieved and has auth', () => {
      mockGlobalAdminState.appInstance = currentMockAppInstance;
      mockUtilsTryGetAuth.mockReturnValue(currentMockAuthService);

      const auth = getFirebaseAdminAuth();

      expect(auth).toBe(currentMockAuthService);
    });

    it('should return undefined if getFirebaseAdminApp returns an error', () => {
      (mockedFirebaseAdminModule.app as jest.Mock).mockImplementation(() => {
        throw new Error('Mocked: App not found in getFirebaseAdminApp path');
      });
      mockGlobalAdminState.appInstance = undefined; // Ensure global is empty for this path

      const auth = getFirebaseAdminAuth();

      expect(auth).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Admin Access] Could not get Firebase Auth service because Firebase Admin App could not be retrieved.',
        'Firebase Admin App not initialized or unrecoverable. Call initializeFirebaseAdmin first.'
      );
    });

    it('should return undefined if app is retrieved but its auth service is missing', () => {
      mockGlobalAdminState.appInstance = currentMockAppInstance;
      mockUtilsTryGetAuth.mockReturnValue(undefined);

      const auth = getFirebaseAdminAuth();

      expect(auth).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        `[Firebase Admin Access] App '${adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME}' was found, but failed to retrieve its Auth service.`
      );
    });
  });
});
