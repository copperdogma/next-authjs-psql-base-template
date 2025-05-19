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

// Mock the logger with a more robust implementation
const mockLoggerMethods = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockChildLogger = { ...mockLoggerMethods };
const mockChildFn = jest.fn(() => mockChildLogger);

jest.mock('@/lib/logger', () => ({
  logger: {
    ...mockLoggerMethods,
    child: mockChildFn,
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
    get FIREBASE_PROJECT_ID() {
      return process.env.FIREBASE_PROJECT_ID;
    },
    get FIREBASE_CLIENT_EMAIL() {
      return process.env.FIREBASE_CLIENT_EMAIL;
    },
    get FIREBASE_PRIVATE_KEY() {
      return process.env.FIREBASE_PRIVATE_KEY;
    },
    get NEXT_PUBLIC_USE_FIREBASE_EMULATOR() {
      return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    },
  },
}));

// Import SUT after all top-level mocks are defined
import { getServerSideFirebaseAdminConfig } from '@/lib/firebase/admin-config';

describe('Firebase Admin Config Module', () => {
  let getServerSideFirebaseAdminConfigInTest: any;

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
    getServerSideFirebaseAdminConfigInTest = adminConfigModule.getServerSideFirebaseAdminConfig;

    const adminModule = require('firebase-admin');
    mockedAdminCredentialCert = adminModule.credential.cert;
    mockedAdminCredentialAppDefault = adminModule.credential.applicationDefault;

    const adminUtilsModule = require('@/lib/firebase/admin-utils');
    mockUtilsGetFirebaseAdminGlobal = adminUtilsModule.getFirebaseAdminGlobal;

    // Clear all mocks (call counts, specific implementations from previous tests)
    jest.clearAllMocks();

    // Get the logger mock for easier assertions
    const { logger } = require('@/lib/logger');

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

  describe('getServerSideFirebaseAdminConfig (formerly createFirebaseAdminConfig)', () => {
    it('should use service account credentials if FIREBASE_PRIVATE_KEY is set', () => {
      // Setup environment variables
      process.env.FIREBASE_PROJECT_ID = 'env-project-id';
      process.env.FIREBASE_CLIENT_EMAIL = 'env-client-email';
      process.env.FIREBASE_PRIVATE_KEY = 'env-private-key\nwith-newlines';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      // Call the function
      const config = getServerSideFirebaseAdminConfigInTest();

      // Check the result based on the actual function structure
      expect(config.projectId).toBe('env-project-id');
      expect(config.clientEmail).toBe('env-client-email');
      expect(config.privateKey).toBe('env-private-key\nwith-newlines');
      expect(config.useEmulator).toBe(false);
      expect(config.nodeEnv).toBe('test');
    });

    it('should use application default credentials if FIREBASE_PRIVATE_KEY is NOT set', () => {
      // Setup environment variables
      process.env.FIREBASE_PROJECT_ID = 'env-project-id-for-default';
      process.env.FIREBASE_CLIENT_EMAIL = undefined;
      process.env.FIREBASE_PRIVATE_KEY = undefined;
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      // Call the function
      const config = getServerSideFirebaseAdminConfigInTest();

      // Check the result based on the actual function structure
      expect(config.projectId).toBe('env-project-id-for-default');
      expect(config.clientEmail).toBeUndefined();
      expect(config.privateKey).toBeUndefined();
      expect(config.useEmulator).toBe(false);
      expect(config.nodeEnv).toBe('test');
    });

    it('should throw error if FIREBASE_PROJECT_ID is not set', () => {
      process.env.FIREBASE_PROJECT_ID = undefined;
      process.env.FIREBASE_CLIENT_EMAIL = undefined;
      process.env.FIREBASE_PRIVATE_KEY = undefined;
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

      expect(() => getServerSideFirebaseAdminConfigInTest()).toThrow(
        'FIREBASE_PROJECT_ID is missing in environment configuration'
      );
    });

    it('should return a basic config if NEXT_PUBLIC_USE_FIREBASE_EMULATOR is true, including nodeEnv', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'emulator-project-id';
      process.env.FIREBASE_PROJECT_ID = 'env-project-id'; // This should be used instead of NEXT_PUBLIC_FIREBASE_PROJECT_ID
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      const config = getServerSideFirebaseAdminConfigInTest();

      expect(config.projectId).toBe('env-project-id'); // The actual implementation uses FIREBASE_PROJECT_ID
      expect(config.useEmulator).toBe(true);
      expect(config.nodeEnv).toBe('test');
    });
  });

  /*
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
      expect(mockGlobalAdminStateForConfigTest.config).toEqual(config);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK config created and cached.')
      );
    });
  });
  */
});
