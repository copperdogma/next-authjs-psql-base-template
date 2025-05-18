// Define the constant FIRST
const UNIQUE_FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-unique-name';

import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
// Import SUT functions directly for testing their implementation
// Functions to be tested are createFirebaseAdminConfig and getFirebaseAdminConfig
// getServerSideFirebaseAdminConfig is also from SUT but might be used as a helper or tested separately

// Mock the admin-types to control the constant
jest.mock('@/lib/firebase/admin-types', () => ({
  ...jest.requireActual('@/lib/firebase/admin-types'),
  UNIQUE_FIREBASE_ADMIN_APP_NAME: 'mocked-app-name-for-config-tests',
}));

const adminTypesActual = jest.requireActual('@/lib/firebase/admin-types');

// Mock the firebase-admin module (a dependency)
jest.mock('firebase-admin', () => {
  const adminTypes = jest.requireActual('@/lib/firebase/admin-types');
  const localMockAuth = {
    getUser: jest.fn(),
    verifyIdToken: jest.fn(),
  };
  const localMockApp = {
    name: adminTypes.UNIQUE_FIREBASE_ADMIN_APP_NAME,
    auth: jest.fn().mockReturnValue(localMockAuth),
  };
  return {
    apps: [],
    initializeApp: jest.fn().mockReturnValue(localMockApp),
    credential: {
      // These will be individually re-mocked in beforeEach if specific return values are needed per test
      cert: jest.fn().mockReturnValue('defaultMockCertValueFromFactory'),
      applicationDefault: jest.fn().mockReturnValue('defaultMockAppDefaultValueFromFactory'),
    },
    app: jest.fn().mockReturnValue(localMockApp),
    auth: jest.fn().mockReturnValue(localMockAuth),
  };
});

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

// Mock the admin-utils module (a dependency)
const mockGlobalAdminStateForConfigTest = {
  appInstance: undefined,
  isInitializing: false,
  config: undefined as object | undefined,
  lock: null,
};
jest.mock('@/lib/firebase/admin-utils', () => ({
  getFirebaseAdminGlobal: jest.fn().mockReturnValue(mockGlobalAdminStateForConfigTest),
  // safeConfigLogging is a helper, can be actual or mocked if it has side effects
  safeConfigLogging: jest.fn(config => config),
}));

// Mock environment variables
jest.mock('@/lib/env', () => ({
  env: {
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_CLIENT_EMAIL: 'test@example.com',
    FIREBASE_PRIVATE_KEY: 'test-private-key',
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR: false,
  },
}));

// Mock the admin-config module (SUT)
jest.mock('@/lib/firebase/admin-config', () => {
  const originalModule = jest.requireActual('@/lib/firebase/admin-config');
  return {
    __esModule: true,
    ...originalModule,
  };
});

// Import SUT after all top-level mocks are defined
import {
  createFirebaseAdminConfig,
  getFirebaseAdminConfig,
  // getServerSideFirebaseAdminConfig // Only if also testing this directly here
} from '@/lib/firebase/admin-config';

describe('Firebase Admin Config Module', () => {
  let createFirebaseAdminConfig: any;
  let getFirebaseAdminConfig: any;

  // References to mocks that might be needed across tests or reconfigured
  let mockedAdminCredentialCert: jest.Mock;
  let mockedAdminCredentialAppDefault: jest.Mock;
  let mockUtilsGetFirebaseAdminGlobal: jest.Mock;

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();

    // Re-require SUT and dependencies to get fresh instances after resetModules
    const adminConfigModule = require('@/lib/firebase/admin-config');
    createFirebaseAdminConfig = adminConfigModule.createFirebaseAdminConfig;
    getFirebaseAdminConfig = adminConfigModule.getFirebaseAdminConfig;

    const adminModule = require('firebase-admin');
    mockedAdminCredentialCert = adminModule.credential.cert;
    mockedAdminCredentialAppDefault = adminModule.credential.applicationDefault;

    const adminUtilsModule = require('@/lib/firebase/admin-utils');
    mockUtilsGetFirebaseAdminGlobal = adminUtilsModule.getFirebaseAdminGlobal;

    // Clear all mocks (call counts, specific implementations from previous tests)
    jest.clearAllMocks();

    // Set default mock implementations for this test suite run AFTER clearAllMocks
    mockedAdminCredentialCert.mockReturnValue('mockedCertInBeforeEach');
    mockedAdminCredentialAppDefault.mockReturnValue('mockedAppDefaultInBeforeEach');

    // Reset and reconfigure admin-utils global state mock for each test
    mockGlobalAdminStateForConfigTest.config = undefined;
    mockUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminStateForConfigTest);

    // Use `as any` for process.env to bypass TypeScript readonly error for NODE_ENV assignment in tests
    (process.env as any).NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createFirebaseAdminConfig', () => {
    it('should use service account credentials if FIREBASE_PRIVATE_KEY is set', () => {
      process.env.FIREBASE_PROJECT_ID = 'env-project-id';
      process.env.FIREBASE_CLIENT_EMAIL = 'env-client-email';
      process.env.FIREBASE_PRIVATE_KEY = 'env-private-key\nwith-newlines';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      const config = createFirebaseAdminConfig();

      expect(mockedAdminCredentialCert).toHaveBeenCalledWith({
        projectId: 'env-project-id',
        clientEmail: 'env-client-email',
        privateKey: 'env-private-key\nwith-newlines'.replace(/\\n/g, '\n'),
      });
      expect(config.credential).toBe('mockedCertInBeforeEach');
      expect(config.projectId).toBe('env-project-id');
      expect(config.appName).toBe(adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME);
      expect(config.nodeEnv).toBe('test');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating Firebase Admin SDK config with service account.')
      );
    });

    it('should use application default credentials if FIREBASE_PRIVATE_KEY is NOT set', () => {
      process.env.FIREBASE_PROJECT_ID = 'env-project-id-for-default';
      process.env.FIREBASE_CLIENT_EMAIL = undefined;
      process.env.FIREBASE_PRIVATE_KEY = undefined;
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      const config = createFirebaseAdminConfig();

      expect(mockedAdminCredentialAppDefault).toHaveBeenCalled();
      expect(mockedAdminCredentialCert).not.toHaveBeenCalled();
      expect(config.credential).toBe('mockedAppDefaultInBeforeEach');
      expect(config.projectId).toBe('env-project-id-for-default');
      expect(config.appName).toBe(adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME);
      expect(config.nodeEnv).toBe('test');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Service account key not found or incomplete. Using application default credentials.'
        )
      );
    });

    it('should throw error if FIREBASE_PRIVATE_KEY and GOOGLE_APPLICATION_CREDENTIALS are not set and app default fails', () => {
      process.env.FIREBASE_PROJECT_ID = undefined;
      process.env.FIREBASE_CLIENT_EMAIL = undefined;
      process.env.FIREBASE_PRIVATE_KEY = undefined;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = undefined;
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';
      mockedAdminCredentialAppDefault.mockImplementation(() => {
        throw new Error('Simulated ADC failure for throw test');
      });

      expect(() => createFirebaseAdminConfig()).toThrow(
        'Firebase Admin SDK config creation failed: Unable to find complete credentials.'
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'No Firebase credentials found via service account or application default credentials after ADC error.'
        ),
        expect.any(Error)
      );
    });

    it('should return a basic config if NEXT_PUBLIC_USE_FIREBASE_EMULATOR is true, including nodeEnv', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'emulator-project-id';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
      process.env.FIREBASE_PROJECT_ID = undefined;
      process.env.FIREBASE_CLIENT_EMAIL = undefined;
      process.env.FIREBASE_PRIVATE_KEY = undefined;

      const config = createFirebaseAdminConfig();

      expect(mockedAdminCredentialCert).not.toHaveBeenCalled();
      expect(mockedAdminCredentialAppDefault).not.toHaveBeenCalled();
      expect(config.projectId).toBe('emulator-project-id');
      expect(config.appName).toBe(adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME);
      expect(config.nodeEnv).toBe('test');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK config for EMULATOR created.')
      );
    });
  });

  describe('getFirebaseAdminConfig', () => {
    it('should return cached config from global state if available', () => {
      const cachedOptions = {
        projectId: 'cached-project',
        credential: 'mock-cached-credential' as any,
        appName: adminTypesActual.UNIQUE_FIREBASE_ADMIN_APP_NAME,
        nodeEnv: 'test', // Ensure cached object is complete
      };
      mockGlobalAdminStateForConfigTest.config = cachedOptions;
      mockUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminStateForConfigTest);

      const config = getFirebaseAdminConfig();

      expect(config).toBe(cachedOptions);
      expect(mockedAdminCredentialCert).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Using cached Firebase Admin SDK config.')
      );
    });

    it('should create, cache, and return new config if not in global state', () => {
      process.env.FIREBASE_PROJECT_ID = 'newly-created-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'newly@created.com';
      process.env.FIREBASE_PRIVATE_KEY = 'newly-created-key';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      mockGlobalAdminStateForConfigTest.config = undefined;
      mockUtilsGetFirebaseAdminGlobal.mockReturnValue(mockGlobalAdminStateForConfigTest);

      const config = getFirebaseAdminConfig();

      expect(mockedAdminCredentialCert).toHaveBeenCalled();
      expect(config.projectId).toBe('newly-created-project');
      expect(config.credential).toBe('mockedCertInBeforeEach');
      expect(mockGlobalAdminStateForConfigTest.config).toEqual(config); // Check caching
      expect(config.nodeEnv).toBe('test');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK config not cached. Creating new config.')
      );
    });
  });
});
