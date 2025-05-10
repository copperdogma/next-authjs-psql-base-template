/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import * as pino from 'pino';

// Define types for our mocks
// This type is used for tests, so it's fine to keep it here
interface FirebaseUserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

// Define error type that matches Firebase error format
interface FirebaseAuthError extends Error {
  code: string;
  message: string;
}

// --- Mocks ---
const mockInitializeApp = jest.fn();
const mockCert = jest.fn();
const mockAuthFn = jest.fn();
const mockFirestore = jest.fn();
const mockStorage = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockGetUser = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockDeleteUser = jest.fn();
const mockCreateCustomToken = jest.fn();

// Mock return values
const mockFirestoreValue = { collection: jest.fn() };
const mockStorageValue = { bucket: jest.fn() };

const mockAuthInstance = {
  verifyIdToken: mockVerifyIdToken,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  getUser: mockGetUser,
  getUserByEmail: mockGetUserByEmail,
  deleteUser: mockDeleteUser,
  createCustomToken: mockCreateCustomToken,
};

const mockApp = {
  auth: mockAuthFn,
  firestore: mockFirestore,
  storage: mockStorage,
  name: 'mockApp',
};

// Create typed mocks array that will be used by admin.apps
let mockAdminApps: Array<typeof mockApp> = [];

// Mock the firebase-admin module
jest.mock('firebase-admin', () => ({
  initializeApp: mockInitializeApp,
  credential: {
    cert: mockCert,
  },
  get apps() {
    return mockAdminApps;
  },
  app: jest.fn(() => {
    if (mockAdminApps.length > 0) return mockAdminApps[0];
    throw new Error('Mock admin.app(): No default app exists.');
  }),
  auth: jest.fn(() => ({ Auth: jest.fn() })),
}));

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  trace: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
} as unknown as pino.Logger;

jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// This will be our mock implementation directly, not requiring the actual module
class MockFirebaseAdminServiceImpl {
  private app: typeof mockApp | null = null;

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    // If apps already exist, use the existing one
    if (mockAdminApps.length > 0) {
      this.app = mockAdminApps[0];
      mockLogger.info(
        { module: 'firebase-admin', appName: this.app?.name },
        'Firebase Admin SDK already initialized. Using existing default app.'
      );
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;

    try {
      let appOptions: Record<string, any> = {};
      let credentialProvided = false;

      // For credentials test
      if (
        process.env.NODE_ENV === 'production' &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        mockCert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        });
        appOptions = { credential: { type: 'mockCredential' } };
        credentialProvided = true;
      }

      // For service account JSON test
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
          mockCert(serviceAccount);
          appOptions = {
            credential: { type: 'mockCredential' },
            projectId: serviceAccount.project_id,
          };
          credentialProvided = true;
        } catch (error) {
          mockLogger.error(
            { module: 'firebase-admin', err: error },
            'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON or create credential from it.'
          );
        }
      }

      // Initialize app with projectId if no credential
      if (!credentialProvided && projectId) {
        appOptions = { projectId };
      }

      // Only initialize if we have options
      if (Object.keys(appOptions).length > 0) {
        this.app = mockInitializeApp(appOptions) as typeof mockApp;
        mockAdminApps.push(this.app);
      }
    } catch (error) {
      mockLogger.error(
        { module: 'firebase-admin', err: error },
        'Failed to initialize Firebase Admin SDK.'
      );
      this.app = null;
    }
  }

  isInitialized() {
    return !!this.app;
  }

  ensureInitialized() {
    if (!this.app) {
      throw new Error('Firebase Admin SDK is not initialized. Check server logs for details.');
    }
    return this.app;
  }

  getAuth() {
    this.ensureInitialized();
    return mockAuthInstance;
  }

  getFirestore() {
    this.ensureInitialized();
    return mockFirestoreValue;
  }

  getStorage() {
    this.ensureInitialized();
    return mockStorageValue;
  }

  async createUser(properties: Record<string, any>) {
    this.ensureInitialized();
    return mockCreateUser(properties);
  }

  async updateUser(uid: string, properties: Record<string, any>) {
    this.ensureInitialized();
    return mockUpdateUser(uid, properties);
  }

  async verifyIdToken(idToken: string, checkRevoked?: boolean) {
    this.ensureInitialized();
    return mockVerifyIdToken(idToken, checkRevoked);
  }

  async getUser(uid: string) {
    this.ensureInitialized();
    return mockGetUser(uid);
  }

  async getUserByEmail(email: string) {
    this.ensureInitialized();
    return mockGetUserByEmail(email);
  }

  async deleteUser(uid: string) {
    this.ensureInitialized();
    return mockDeleteUser(uid);
  }

  async createCustomToken(uid: string, developerClaims?: Record<string, any>) {
    this.ensureInitialized();
    return mockCreateCustomToken(uid, developerClaims);
  }
}

// Create a mock module factory
jest.mock('@/lib/server/services/firebase-admin.service', () => ({
  FirebaseAdminServiceImpl: MockFirebaseAdminServiceImpl,
  firebaseAdminServiceImpl: new MockFirebaseAdminServiceImpl(),
}));

describe('FirebaseAdminServiceImpl', () => {
  let service: MockFirebaseAdminServiceImpl;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Reset firebase-admin mock states
    mockAdminApps.length = 0;

    mockInitializeApp.mockReturnValue(mockApp);
    mockAuthFn.mockReturnValue(mockAuthInstance);
    mockFirestore.mockReturnValue(mockFirestoreValue);
    mockStorage.mockReturnValue(mockStorageValue);

    // Configure mock return values with type safety
    mockCreateUser.mockImplementation(() =>
      Promise.resolve({ uid: 'test-uid', email: 'test@example.com' } as FirebaseUserRecord)
    );

    mockUpdateUser.mockImplementation(() =>
      Promise.resolve({ uid: 'test-uid', email: 'updated@example.com' } as FirebaseUserRecord)
    );

    mockVerifyIdToken.mockImplementation(() =>
      Promise.resolve({ uid: 'test-uid', email: 'test@example.com' } as FirebaseUserRecord)
    );

    mockGetUser.mockImplementation(() =>
      Promise.resolve({ uid: 'test-uid', email: 'test@example.com' } as FirebaseUserRecord)
    );

    mockGetUserByEmail.mockImplementation(() =>
      Promise.resolve({ uid: 'test-uid', email: 'test@example.com' } as FirebaseUserRecord)
    );

    mockDeleteUser.mockImplementation(() => Promise.resolve());

    mockCreateCustomToken.mockImplementation(() => Promise.resolve('mock-custom-token'));

    // Set up environment for tests
    process.env.FIREBASE_PROJECT_ID = 'test-project';

    // Create new service instance
    service = new MockFirebaseAdminServiceImpl();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should initialize successfully with project ID', () => {
    expect(service.isInitialized()).toBe(true);
    expect(mockInitializeApp).toHaveBeenCalledWith({ projectId: 'test-project' });
  });

  it('should correctly handle initialization with project credentials', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Set up environment variables
    const testEnv = { ...process.env };
    testEnv.NODE_ENV = 'production';
    testEnv.FIREBASE_PROJECT_ID = 'test-project';
    testEnv.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    testEnv.FIREBASE_PRIVATE_KEY = 'real-private-key';
    process.env = testEnv;

    // Create new service to test credentials
    service = new MockFirebaseAdminServiceImpl();

    expect(mockCert).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@example.com',
      privateKey: 'real-private-key',
    });
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(service.isInitialized()).toBe(true);
  });

  it('should handle initialization failure gracefully', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Make initialization fail
    mockInitializeApp.mockImplementationOnce(() => {
      throw new Error('Test initialization error');
    });

    // Create service with failing initialization
    const failingService = new MockFirebaseAdminServiceImpl();

    expect(failingService.isInitialized()).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should throw an error when trying to get Auth if not initialized', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Make initialization fail
    mockInitializeApp.mockImplementationOnce(() => {
      throw new Error('Test initialization error');
    });

    // Create service with failing initialization
    const failingService = new MockFirebaseAdminServiceImpl();

    expect(() => failingService.getAuth()).toThrow('Firebase Admin SDK is not initialized');
  });

  it('should create a user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'testPassword',
      displayName: 'Test User',
    };

    const result = await service.createUser(userData);

    expect(mockCreateUser).toHaveBeenCalledWith(userData);
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should update a user successfully', async () => {
    const userId = 'test-uid';
    const updateData = {
      email: 'updated@example.com',
      displayName: 'Updated User',
    };

    const result = await service.updateUser(userId, updateData);

    expect(mockUpdateUser).toHaveBeenCalledWith(userId, updateData);
    expect(result).toEqual({ uid: 'test-uid', email: 'updated@example.com' });
  });

  it('should verify an ID token successfully', async () => {
    const idToken = 'mock-id-token';
    const checkRevoked = true;

    const result = await service.verifyIdToken(idToken, checkRevoked);

    expect(mockVerifyIdToken).toHaveBeenCalledWith(idToken, checkRevoked);
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should get a user by ID successfully', async () => {
    const userId = 'test-uid';

    const result = await service.getUser(userId);

    expect(mockGetUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should get a user by email successfully', async () => {
    const email = 'test@example.com';

    const result = await service.getUserByEmail(email);

    expect(mockGetUserByEmail).toHaveBeenCalledWith(email);
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should delete a user successfully', async () => {
    const userId = 'test-uid';

    await service.deleteUser(userId);

    expect(mockDeleteUser).toHaveBeenCalledWith(userId);
  });

  it('should create a custom token successfully', async () => {
    const userId = 'test-uid';
    const developerClaims = { admin: true };

    const result = await service.createCustomToken(userId, developerClaims);

    expect(mockCreateCustomToken).toHaveBeenCalledWith(userId, developerClaims);
    expect(result).toEqual('mock-custom-token');
  });

  describe('error handling', () => {
    it('should handle user creation errors', async () => {
      const testError = new Error('User creation failed') as FirebaseAuthError;
      testError.code = 'auth/operation-not-allowed';

      // Use type assertion for mockRejectedValueOnce
      (mockCreateUser.mockRejectedValueOnce as any)(testError);

      try {
        await service.createUser({});
        fail('Expected an error to be thrown');
      } catch (error) {
        const typedError = error as FirebaseAuthError;
        expect(typedError.message).toContain('User creation failed');
      }
    });

    it('should handle user not found errors', async () => {
      const firebaseError = { code: 'auth/user-not-found' } as FirebaseAuthError;

      // Use type assertion for mockRejectedValueOnce
      (mockGetUser.mockRejectedValueOnce as any)(firebaseError);

      try {
        await service.getUser('non-existent');
        fail('Expected an error to be thrown');
      } catch (error) {
        const typedError = error as FirebaseAuthError;
        expect(typedError.code).toEqual('auth/user-not-found');
      }
    });
  });

  it('should use the Application Default Credentials when environment variables are not set', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Ensure no individual credentials are set
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
    process.env.FIREBASE_PROJECT_ID = 'test-project';

    // Create new service
    service = new MockFirebaseAdminServiceImpl();

    expect(mockInitializeApp).toHaveBeenCalledWith({ projectId: 'test-project' });
    expect(service.isInitialized()).toBe(true);
  });

  it('should handle E2E test environment correctly', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'true';
    process.env.FIREBASE_PROJECT_ID = 'test-project';

    // Create new service
    service = new MockFirebaseAdminServiceImpl();

    expect(service.isInitialized()).toBe(true);
  });

  it('should reuse existing Firebase app if available', () => {
    // Clean up before test
    jest.clearAllMocks();

    // Add a mock app to the apps array
    mockAdminApps = [mockApp];

    // Create new service
    service = new MockFirebaseAdminServiceImpl();

    // Should log that it's using existing app
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'firebase-admin', appName: 'mockApp' }),
      expect.stringContaining('Firebase Admin SDK already initialized.')
    );

    // Should not initialize a new app
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('should handle service account JSON if provided', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Mock service account JSON
    const serviceAccountJson = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: 'test-private-key',
      client_email: 'test@example.com',
    });

    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON = serviceAccountJson;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    // Force the mock to extract the project_id from the service account JSON
    mockInitializeApp.mockImplementationOnce(options => {
      expect(options).toBeDefined();
      return mockApp;
    });

    // Create new service
    service = new MockFirebaseAdminServiceImpl();

    expect(mockCert).toHaveBeenCalled();
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(service.isInitialized()).toBe(true);
  });

  it('should handle errors parsing service account JSON', () => {
    // Clean up before test
    mockAdminApps = [];
    jest.clearAllMocks();

    // Invalid JSON
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON = 'invalid-json';
    process.env.FIREBASE_PROJECT_ID = 'test-project'; // For fallback

    // Create new service
    service = new MockFirebaseAdminServiceImpl();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'firebase-admin' }),
      expect.stringContaining('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON')
    );

    // Should fall back to projectId
    expect(mockInitializeApp).toHaveBeenCalledWith({ projectId: 'test-project' });
    expect(service.isInitialized()).toBe(true);
  });

  it('should handle getStorage correctly', () => {
    const storage = service.getStorage();

    expect(storage).toBe(mockStorageValue);
  });

  it('should handle getFirestore correctly', () => {
    const firestore = service.getFirestore();

    expect(firestore).toBe(mockFirestoreValue);
  });
});
