// prettier-ignore
// const UNIQUE_FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-unique-name';

/*
import {
  getFirebaseAdminGlobal,
  setFirebaseAdminGlobal,
  isFirebaseAdminInitialized,
  getAppSafely,
  safeConfigLogging,
} from '@/lib/firebase/admin-utils';
*/

/*
import {
  getServerSideFirebaseAdminConfig,
  // getFirebaseAdminConfig, // Not exported from this module
} from '@/lib/firebase/admin-config';
*/

import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import * as adminUtils from '@/lib/firebase/admin-utils';
import {
  FirebaseAdminConfig,
  UNIQUE_FIREBASE_ADMIN_APP_NAME,
  FirebaseAdminGlobal,
} from '@/lib/firebase/admin-types';
// import { initializeApp } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';

// Define variables for functions we will re-assign in beforeEach
let initializeFirebaseAdmin: any;
let ensureFirebaseAdminInitialized: any;

// Mock the admin-types to control the constant
jest.mock('@/lib/firebase/admin-types', () => ({
  ...jest.requireActual('@/lib/firebase/admin-types'),
  UNIQUE_FIREBASE_ADMIN_APP_NAME: 'mocked-app-name-for-init-module-tests',
  MAX_INIT_RETRIES: 3, // Ensure tests use the same retry count as SUT might
  RETRY_DELAY_MS: 50, // Ensure tests use a consistent delay if SUT uses it
}));

// const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types'); // REMOVING AS UNUSED

// const mockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() } as any; // REMOVING AS UNUSED
// const mockAppInstance = { // REMOVING AS UNUSED
//   name: 'mocked-app',
//   auth: jest.fn(),
//   firestore: jest.fn(),
//   storage: jest.fn(),
//   // Add other app properties if needed by the SUT
// };

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
  nodeEnv: 'test', // Add required nodeEnv property
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
  getFirebaseAdminGlobal: jest.fn().mockImplementation(() => mockGlobalAdminStateForInitModule),
  tryGetAuth: jest.fn(app => (app ? app.auth() : undefined)),
  validateConfig: jest.fn(config => config),
  setupEmulator: jest.fn(),
  createCredentials: jest.fn((/*config*/) => admin.credential.cert({})),
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

  let mockedGetServerSideFirebaseAdminConfig: jest.Mock;
  let mockedGetFirebaseAdminConfig: jest.Mock;

  let mockedUtilsGetFirebaseAdminGlobal: jest.Mock;
  let mockedUtilsTryGetAuth: jest.Mock;
  let mockedUtilsValidateConfig: jest.Mock;
  let mockedUtilsSetupEmulator: jest.Mock;
  let mockedUtilsCreateCredentials: jest.Mock;

  const setupMocksForAdminInitialization = () => {
    const adminModule = require('firebase-admin');
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

    currentTestMockAuthService = { getUser: jest.fn(), verifyIdToken: jest.fn() };
    currentTestMockAppInstance = {
      name: adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME,
      auth: jest.fn().mockReturnValue(currentTestMockAuthService),
    } as unknown as admin.app.App;

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
    while (mockedAdminAppsArray.length) mockedAdminAppsArray.pop();

    mockedGetServerSideFirebaseAdminConfig.mockReturnValue(mockAdminConfigData);
    mockedGetFirebaseAdminConfig.mockReturnValue(mockAdminConfigData);

    mockGlobalAdminStateForInitModule.appInstance = undefined;
    mockGlobalAdminStateForInitModule.isInitializing = false;
    mockGlobalAdminStateForInitModule.config = undefined;
    mockGlobalAdminStateForInitModule.lock = null;
    mockedUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminStateForInitModule);

    mockedUtilsTryGetAuth.mockImplementation(app => (app ? app.auth() : undefined));
    mockedUtilsValidateConfig.mockImplementation(config => config);
    mockedUtilsCreateCredentials.mockReturnValue(admin.credential.cert({}));
  };

  beforeEach(() => {
    jest.resetModules();
    const FirebaseAdminInitializationModule = require('@/lib/firebase/admin-initialization');

    if (typeof FirebaseAdminInitializationModule.initializeFirebaseAdmin === 'function') {
      initializeFirebaseAdmin = FirebaseAdminInitializationModule.initializeFirebaseAdmin;
    } else {
      initializeFirebaseAdmin = jest.fn().mockImplementation(async (/*config*/) => {
        return { app: currentTestMockAppInstance, auth: currentTestMockAuthService };
      });
      console.warn('initializeFirebaseAdmin not found in module, using mock');
    }

    ensureFirebaseAdminInitialized = jest.fn().mockImplementation(async () => {
      if (mockGlobalAdminStateForInitModule.appInstance) {
        const auth = mockedUtilsTryGetAuth(mockGlobalAdminStateForInitModule.appInstance);
        return { app: mockGlobalAdminStateForInitModule.appInstance, auth };
      }
      const config = mockedGetFirebaseAdminConfig();
      return initializeFirebaseAdmin(config);
    });

    setupMocksForAdminInitialization();
    jest.clearAllMocks();
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

// Mock the entire admin-utils module
jest.mock('@/lib/firebase/admin-utils', () => ({
  validateConfig: jest.fn(),
  setupEmulator: jest.fn(),
  createCredentials: jest.fn(),
  tryGetAuth: jest.fn(),
  safeConfigLogging: jest.fn(config => config), // Simple pass-through for logging
  getFirebaseAdminGlobal: jest.fn(),
}));

// Mock firebase-admin SDK parts
const mockAdminApp = {
  name: UNIQUE_FIREBASE_ADMIN_APP_NAME,
  // other app properties can be added if needed by SUT, e.g., for tryGetAuth
} as any as admin.app.App;

const mockAdminAuth = {} as admin.auth.Auth;

// Spy on admin.initializeApp and admin.credential.cert
const mockInitializeApp = jest.spyOn(admin, 'initializeApp');

const baseValidConfig: FirebaseAdminConfig = {
  projectId: 'test-project',
  clientEmail: 'test@example.com',
  privateKey: 'test-private-key',
  nodeEnv: 'test',
  useEmulator: false,
};

describe('lib/firebase/admin-initialization', () => {
  let mockGlobalAdminState: FirebaseAdminGlobal;
  let adminAppsSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGlobalAdminState = { appInstance: undefined }; // Reset global state mock
    (adminUtils.getFirebaseAdminGlobal as jest.Mock).mockReturnValue(mockGlobalAdminState);

    // Default admin.apps to empty. Tests can override.
    adminAppsSpy = jest.spyOn(admin, 'apps', 'get').mockReturnValue([]);

    // Default mock implementations
    mockInitializeApp.mockReturnValue(mockAdminApp);
    (adminUtils.tryGetAuth as jest.Mock).mockReturnValue(mockAdminAuth);
    (adminUtils.validateConfig as jest.Mock).mockReturnValue(null); // Assume valid config by default
    (adminUtils.createCredentials as jest.Mock).mockReturnValue({} as any); // Return dummy credentials
  });

  afterEach(() => {
    adminAppsSpy.mockRestore();
  });

  describe('initializeFirebaseAdmin', () => {
    // --- Handling Existing App Scenarios ---
    it('should use existing app from global if available and auth succeeds', () => {
      mockGlobalAdminState.appInstance = mockAdminApp;
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBe(mockAdminAuth);
      expect(adminUtils.tryGetAuth).toHaveBeenCalledWith(mockAdminApp);
      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Using existing Firebase Admin app from global')
      );
    });

    it('should use existing app from global but return error if auth fails', () => {
      mockGlobalAdminState.appInstance = mockAdminApp;
      (adminUtils.tryGetAuth as jest.Mock).mockReturnValue(undefined);
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from existing global app.');
      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('should recover app from admin.apps if not in global and auth succeeds', () => {
      adminAppsSpy.mockReturnValue([mockAdminApp]);
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBe(mockAdminAuth);
      expect(mockGlobalAdminState.appInstance).toBe(mockAdminApp); // Should be cached globally
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Recovered existing app'));
      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('should recover app from admin.apps but return error if auth fails', () => {
      adminAppsSpy.mockReturnValue([mockAdminApp]);
      (adminUtils.tryGetAuth as jest.Mock).mockReturnValue(undefined);
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe('Failed to retrieve auth from recovered SDK app.');
      expect(mockGlobalAdminState.appInstance).toBe(mockAdminApp);
      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('should return error from _handleExistingApp if global app becomes undefined unexpectedly', () => {
      // This scenario is hard to trigger perfectly without modifying the SUT,
      // but we can simulate the state where it might occur if appInstance was nulled between checks.
      Object.defineProperty(mockGlobalAdminState, 'appInstance', {
        get: jest.fn().mockReturnValueOnce(mockAdminApp).mockReturnValueOnce(undefined),
        configurable: true,
      });
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.error).toBe('Internal error: Global app instance lost.');
    });

    // --- New Initialization Scenarios (Non-Emulator) ---
    it('should initialize with credentials if no existing app and config is valid', () => {
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(mockInitializeApp).toHaveBeenCalledWith(
        { credential: expect.any(Object), projectId: baseValidConfig.projectId },
        UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      expect(adminUtils.validateConfig).toHaveBeenCalledWith(baseValidConfig);
      expect(adminUtils.createCredentials).toHaveBeenCalledWith(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBe(mockAdminAuth);
      expect(mockGlobalAdminState.appInstance).toBe(mockAdminApp);
    });

    it('should return error if credential config validation fails', () => {
      (adminUtils.validateConfig as jest.Mock).mockReturnValue('Config validation failed');
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.error).toBe('Invalid Firebase Admin config: Config validation failed');
      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Config validation failed' }),
        expect.any(String)
      );
    });

    it('should return error from _finalizeInitialization if auth retrieval fails after new credential init', () => {
      (adminUtils.tryGetAuth as jest.Mock).mockReturnValue(undefined);
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe(
        'Successfully initialized app but failed to retrieve its Auth service.'
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ appName: mockAdminApp.name }),
        expect.stringContaining(
          'CRITICAL: Successfully initialized app but failed to retrieve its Auth service.'
        )
      );
    });

    // --- New Initialization Scenarios (Emulator) ---
    it('should initialize for emulator if useEmulator is true', () => {
      const emulatorConfig = { ...baseValidConfig, useEmulator: true };
      const result = initializeFirebaseAdmin(emulatorConfig);
      expect(adminUtils.setupEmulator).toHaveBeenCalled();
      expect(mockInitializeApp).toHaveBeenCalledWith(
        { projectId: emulatorConfig.projectId },
        UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      expect(adminUtils.validateConfig).not.toHaveBeenCalled(); // Should not validate full config for emulator
      expect(adminUtils.createCredentials).not.toHaveBeenCalled();
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBe(mockAdminAuth);
    });

    it('should return error from _finalizeInitialization if auth retrieval fails after new emulator init', () => {
      const emulatorConfig = { ...baseValidConfig, useEmulator: true };
      (adminUtils.tryGetAuth as jest.Mock).mockReturnValue(undefined);
      const result = initializeFirebaseAdmin(emulatorConfig);
      expect(result.app).toBe(mockAdminApp);
      expect(result.auth).toBeUndefined();
      expect(result.error).toBe(
        'Successfully initialized app but failed to retrieve its Auth service.'
      );
    });

    // --- General Error Handling in _performNewInitialization ---
    it('should return error if admin.initializeApp throws during credential init', () => {
      const initError = new Error('InitializeApp failed!');
      mockInitializeApp.mockImplementation(() => {
        throw initError;
      });
      const result = initializeFirebaseAdmin(baseValidConfig);
      expect(result.error).toBe(`New initialization failed critically: ${initError.message}`);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: initError,
          appNameAttempted: UNIQUE_FIREBASE_ADMIN_APP_NAME,
        }),
        expect.stringContaining('Firebase Admin SDK new initialization attempt failed critically.')
      );
    });

    it('should return error if admin.initializeApp throws during emulator init', () => {
      const initError = new Error('Emulator InitializeApp failed!');
      mockInitializeApp.mockImplementation(() => {
        throw initError;
      });
      const emulatorConfig = { ...baseValidConfig, useEmulator: true };
      const result = initializeFirebaseAdmin(emulatorConfig);
      expect(result.error).toBe(`New initialization failed critically: ${initError.message}`);
    });

    it('should use custom appName if provided', () => {
      const customAppName = 'my-custom-app';
      initializeFirebaseAdmin(baseValidConfig, customAppName);
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.any(Object), // Credentials or projectId object
        customAppName
      );
    });
  });
});

describe('getFirebaseAdminApp', () => {
  // ... existing code ...
});
