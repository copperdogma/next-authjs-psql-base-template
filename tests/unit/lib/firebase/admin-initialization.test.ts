// Define the constant FIRST
const UNIQUE_FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-unique-name';

import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import {
  getFirebaseAdminGlobal,
  tryGetAuth,
  validateConfig,
  setupEmulator,
  createCredentials,
  safeConfigLogging,
} from '@/lib/firebase/admin-utils';
import {
  getServerSideFirebaseAdminConfig,
  getFirebaseAdminConfig,
} from '@/lib/firebase/admin-config';
import {
  initializeFirebaseAdmin,
  ensureFirebaseAdminInitialized,
} from '@/lib/firebase/admin-initialization';

// Mock the admin-types to control the constant
jest.mock('@/lib/firebase/admin-types', () => ({
  ...jest.requireActual('@/lib/firebase/admin-types'),
  UNIQUE_FIREBASE_ADMIN_APP_NAME: 'mocked-app-name-for-init-module-tests',
  MAX_INIT_RETRIES: 3, // Ensure tests use the same retry count as SUT might
  RETRY_DELAY_MS: 50, // Ensure tests use a consistent delay if SUT uses it
}));

const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types');

const mockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() } as any;
const mockAppInstance = {
  name: adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME,
  auth: jest.fn().mockReturnValue(mockAuthService),
  // Add other app properties/methods if the SUT interacts with them
} as unknown as admin.app.App;

jest.mock('firebase-admin', () => {
  const adminTypes = jest.requireActual('@/lib/firebase/admin-types');
  const localAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() } as any;
  const localAppInstance = {
    name: adminTypes.UNIQUE_FIREBASE_ADMIN_APP_NAME,
    auth: jest.fn().mockReturnValue(localAuthService),
  } as unknown as admin.app.App;

  return {
    apps: [] as admin.app.App[],
    initializeApp: jest.fn().mockReturnValue(localAppInstance),
    credential: {
      cert: jest.fn().mockReturnValue('mocked-admin-credential-cert-for-init'),
      applicationDefault: jest.fn().mockReturnValue('mocked-admin-credential-default-for-init'),
    },
    app: jest.fn((appName?: string) => {
      const currentApps = (admin as any).apps as admin.app.App[]; // Access live apps array
      if (!appName) return localAppInstance; // Or perhaps the first app in currentApps if any
      const foundApp = currentApps.find(a => a.name === appName);
      if (foundApp) return foundApp;
      throw new Error(`Mock Firebase Admin (init-test): No app with name ${appName} found`);
    }),
    auth: jest.fn(() => localAuthService),
  };
});

const mockAdminConfigData = {
  projectId: 'mock-config-project-id-for-init',
  appName: jest.requireActual('@/lib/firebase/admin-types').UNIQUE_FIREBASE_ADMIN_APP_NAME,
  credential: 'mock-config-credential-for-init' as any,
  useEmulator: false,
};
jest.mock('@/lib/firebase/admin-config', () => ({
  getServerSideFirebaseAdminConfig: jest.fn().mockReturnValue(mockAdminConfigData),
  getFirebaseAdminConfig: jest.fn().mockReturnValue(mockAdminConfigData),
}));

const mockGlobalAdminStateForInitModule = {
  appInstance: undefined as admin.app.App | undefined,
  isInitializing: false,
  config: undefined as object | undefined,
  lock: null as Promise<any> | null,
};
jest.mock('@/lib/firebase/admin-utils', () => ({
  getFirebaseAdminGlobal: jest.fn().mockReturnValue(mockGlobalAdminStateForInitModule),
  tryGetAuth: jest.fn(app => (app ? app.auth() : undefined)),
  validateConfig: jest.fn(config => config),
  setupEmulator: jest.fn(),
  createCredentials: jest.fn(config => admin.credential.cert({})),
  safeConfigLogging: jest.fn(config => config),
}));

describe('Firebase Admin Initialization Module', () => {
  const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types');
  let currentTestMockAppInstance: admin.app.App;
  let currentTestMockAuthService: any;

  // Get typed references to mocks that will be reconfigured in beforeEach
  let mockedAdminInitializeApp: jest.Mock;
  let mockedAdminAppsArray: admin.app.App[];
  let mockedAdminAppFn: jest.Mock;
  let mockedFirebaseAdminModuleForTest: any; // To hold the 'admin' import itself

  let mockedGetServerSideFirebaseAdminConfig: jest.Mock;
  let mockedGetFirebaseAdminConfig: jest.Mock;

  let mockedUtilsGetFirebaseAdminGlobal: jest.Mock;
  let mockedUtilsTryGetAuth: jest.Mock;
  let mockedUtilsValidateConfig: jest.Mock;
  let mockedUtilsSetupEmulator: jest.Mock;
  let mockedUtilsCreateCredentials: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    // Re-require SUT and dependencies to get fresh mocks and SUT instance
    const FirebaseAdminInitializationModule = require('@/lib/firebase/admin-initialization');
    initializeFirebaseAdmin = FirebaseAdminInitializationModule.initializeFirebaseAdmin;
    ensureFirebaseAdminInitialized =
      FirebaseAdminInitializationModule.ensureFirebaseAdminInitialized;

    const adminModule = require('firebase-admin');
    mockedFirebaseAdminModuleForTest = adminModule;
    mockedAdminInitializeApp = adminModule.initializeApp;
    mockedAdminAppsArray = adminModule.apps;
    mockedAdminAppFn = adminModule.app;

    const adminConfigModule = require('@/lib/firebase/admin-config');
    mockedGetServerSideFirebaseAdminConfig = adminConfigModule.getServerSideFirebaseAdminConfig;
    mockedGetFirebaseAdminConfig = adminConfigModule.getFirebaseAdminConfig;

    const adminUtilsModule = require('@/lib/firebase/admin-utils');
    mockedUtilsGetFirebaseAdminGlobal = adminUtilsModule.getFirebaseAdminGlobal;
    mockedUtilsTryGetAuth = adminUtilsModule.tryGetAuth;
    mockedUtilsValidateConfig = adminUtilsModule.validateConfig;
    mockedUtilsSetupEmulator = adminUtilsModule.setupEmulator;
    mockedUtilsCreateCredentials = adminUtilsModule.createCredentials;

    jest.clearAllMocks(); // Clear call counts etc. AFTER re-requiring and getting new mock references

    // Define the app/auth instances that will be returned by the NEW mocks obtained after resetModules
    currentTestMockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() };
    currentTestMockAppInstance = {
      name: adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME,
      auth: jest.fn().mockReturnValue(currentTestMockAuthService),
    } as unknown as admin.app.App;

    // Configure the NEW mocks
    mockedAdminInitializeApp.mockReturnValue(currentTestMockAppInstance);
    (currentTestMockAppInstance.auth as jest.Mock).mockReturnValue(currentTestMockAuthService);
    mockedAdminAppFn.mockImplementation((appName?: string) => {
      if (!appName) return currentTestMockAppInstance;
      const found = mockedAdminAppsArray.find(a => a.name === appName);
      if (found) return found;
      throw new Error(
        `Mock Firebase Admin beforeEach (init-test): No app with name ${appName} found`
      );
    });
    while (mockedAdminAppsArray.length) mockedAdminAppsArray.pop(); // Clear for the test

    mockedGetServerSideFirebaseAdminConfig.mockReturnValue(mockAdminConfigData);
    mockedGetFirebaseAdminConfig.mockReturnValue(mockAdminConfigData);

    mockGlobalAdminStateForInitModule.appInstance = undefined;
    mockGlobalAdminStateForInitModule.isInitializing = false;
    mockGlobalAdminStateForInitModule.config = undefined;
    mockGlobalAdminStateForInitModule.lock = null;
    mockedUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminStateForInitModule);

    mockedUtilsTryGetAuth.mockImplementation(app => (app ? app.auth() : undefined));
    mockedUtilsValidateConfig.mockImplementation(config => config);
    mockedUtilsCreateCredentials.mockReturnValue(admin.credential.cert({})); // Use actual admin.credential here
  });

  describe('initializeFirebaseAdmin', () => {
    it('should initialize SDK, set global state, and return app/auth if not initialized', async () => {
      const testConfigData = { ...mockAdminConfigData, projectId: 'init-test-project-actual' };
      mockedGetServerSideFirebaseAdminConfig.mockReturnValue(testConfigData);

      const result = await initializeFirebaseAdmin(testConfigData);

      expect(mockedUtilsGetFirebaseAdminGlobal).toHaveBeenCalledTimes(1);
      expect(mockedUtilsValidateConfig).toHaveBeenCalledWith(testConfigData);
      expect(mockedUtilsCreateCredentials).toHaveBeenCalledWith(testConfigData);
      expect(mockedAdminInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({ credential: expect.anything() }), // Credential obj is created by mock
        adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      expect(mockedUtilsTryGetAuth).toHaveBeenCalledWith(
        currentTestMockAppInstance,
        expect.any(Object)
      );
      expect(result.app).toBe(currentTestMockAppInstance);
      expect(result.auth).toBe(currentTestMockAuthService);
      expect(result.error).toBeUndefined();
      expect(mockGlobalAdminStateForInitModule.appInstance).toBe(currentTestMockAppInstance);
      expect(mockGlobalAdminStateForInitModule.isInitializing).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK initialized successfully')
      );
    });

    it('should return existing app/auth if appInstance already in global state', async () => {
      mockGlobalAdminStateForInitModule.appInstance = currentTestMockAppInstance;
      mockedUtilsTryGetAuth.mockReturnValue(currentTestMockAuthService);
      const testConfigData = { ...mockAdminConfigData, projectId: 'already-init-project-actual' };

      const result = await initializeFirebaseAdmin(testConfigData);

      expect(mockedAdminInitializeApp).not.toHaveBeenCalled();
      expect(result.app).toBe(currentTestMockAppInstance);
      expect(result.auth).toBe(currentTestMockAuthService);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK already initialized with name:')
      );
    });

    it('should handle initialization error from admin.initializeApp', async () => {
      const initError = new Error('initializeApp failed badly in test');
      mockedAdminInitializeApp.mockImplementation(() => {
        throw initError;
      });
      const testConfigData = { ...mockAdminConfigData, projectId: 'init-fail-project-actual' };

      const result = await initializeFirebaseAdmin(testConfigData);

      expect(result.app).toBeUndefined();
      expect(result.auth).toBeUndefined();
      expect(result.error).toContain('Failed to initialize Firebase Admin SDK');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Firebase Admin SDK'),
        initError
      );
      expect(mockGlobalAdminStateForInitModule.isInitializing).toBe(false);
      expect(mockGlobalAdminStateForInitModule.lock).toBeNull();
    });

    it('should wait for an ongoing initialization to complete (lock mechanism)', async () => {
      let resolveOngoingInit: (value: {
        app?: admin.app.App;
        auth?: any;
        error?: string;
      }) => void = () => {};
      const ongoingInitPromise = new Promise<{ app?: admin.app.App; auth?: any; error?: string }>(
        resolve => {
          resolveOngoingInit = resolve;
        }
      );

      mockGlobalAdminStateForInitModule.isInitializing = true;
      mockGlobalAdminStateForInitModule.lock = ongoingInitPromise;
      const testConfigData = { ...mockAdminConfigData, projectId: 'waiting-project-actual' };

      const resultPromise = initializeFirebaseAdmin(testConfigData);
      // Check for log after a microtask tick to allow async SUT logic to run
      await Promise.resolve();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Another initialization is in progress... Waiting...')
      );

      resolveOngoingInit({ app: currentTestMockAppInstance, auth: currentTestMockAuthService });
      const result = await resultPromise;

      expect(result.app).toBe(currentTestMockAppInstance);
      expect(result.auth).toBe(currentTestMockAuthService);
      expect(mockedAdminInitializeApp).not.toHaveBeenCalled();
    });

    it('should setup emulator if config.useEmulator is true', async () => {
      const emulatorConfigData = {
        ...mockAdminConfigData,
        useEmulator: true,
        projectId: 'emu-project-actual',
      };
      await initializeFirebaseAdmin(emulatorConfigData);
      expect(mockedUtilsSetupEmulator).toHaveBeenCalledWith(emulatorConfigData);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Using Firebase Emulator for Admin SDK')
      );
    });
  });

  describe('ensureFirebaseAdminInitialized', () => {
    it('should return existing app/auth if already initialized (global state check)', async () => {
      mockGlobalAdminStateForInitModule.appInstance = currentTestMockAppInstance;
      mockedUtilsTryGetAuth.mockReturnValue(currentTestMockAuthService);

      const result = await ensureFirebaseAdminInitialized();

      expect(mockedGetFirebaseAdminConfig).not.toHaveBeenCalled();
      expect(mockedAdminInitializeApp).not.toHaveBeenCalled();
      expect(result.app).toBe(currentTestMockAppInstance);
      expect(result.auth).toBe(currentTestMockAuthService);
    });

    it('should initialize using getFirebaseAdminConfig if not already initialized', async () => {
      const result = await ensureFirebaseAdminInitialized();

      expect(mockedGetFirebaseAdminConfig).toHaveBeenCalledTimes(1);
      expect(mockedAdminInitializeApp).toHaveBeenCalledTimes(1);
      expect(result.app).toBe(currentTestMockAppInstance);
      expect(result.auth).toBe(currentTestMockAuthService);
    });

    it('should retry initialization on failure up to MAX_INIT_RETRIES times then succeed', async () => {
      let attempt = 0;
      const maxRetries = adminTypesActual.MAX_INIT_RETRIES || 3;
      mockedAdminInitializeApp.mockImplementation(() => {
        attempt++;
        if (attempt < maxRetries) {
          throw new Error(`Simulated init failure attempt ${attempt} in ensure`);
        }
        return currentTestMockAppInstance;
      });

      const result = await ensureFirebaseAdminInitialized();

      expect(mockedGetFirebaseAdminConfig).toHaveBeenCalledTimes(maxRetries);
      expect(mockedAdminInitializeApp).toHaveBeenCalledTimes(maxRetries);
      expect(logger.warn).toHaveBeenCalledTimes(maxRetries - 1);
      for (let i = 1; i < maxRetries; i++) {
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `Retrying Firebase Admin SDK initialization (attempt ${i} of ${maxRetries})`
          )
        );
      }
      expect(result.app).toBe(currentTestMockAppInstance);
    });

    it('should return error after all retries fail for ensureFirebaseAdminInitialized', async () => {
      const maxRetries = adminTypesActual.MAX_INIT_RETRIES || 3;
      const persistentError = new Error('Persistent ensure failure in test');
      mockedAdminInitializeApp.mockImplementation(() => {
        throw persistentError;
      });

      const result = await ensureFirebaseAdminInitialized();

      expect(mockedGetFirebaseAdminConfig).toHaveBeenCalledTimes(maxRetries);
      expect(mockedAdminInitializeApp).toHaveBeenCalledTimes(maxRetries);
      expect(result.app).toBeUndefined();
      expect(result.auth).toBeUndefined();
      expect(result.error).toContain(
        `All initialization attempts failed after ${maxRetries} retries.`
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`All initialization attempts failed after ${maxRetries} retries.`),
        persistentError
      );
    });
  });
});
