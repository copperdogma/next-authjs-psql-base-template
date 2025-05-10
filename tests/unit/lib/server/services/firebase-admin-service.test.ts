/**
 * @jest-environment node
 */

// Add imports first to avoid type issues
import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';

// The path will be relative to the test file location, mapping to the actual service
import { FirebaseAdminServiceImpl } from '@/lib/server/services/firebase-admin.service';

// Create type definitions for the mock objects
interface MockUserRecord {
  uid: string;
  email?: string;
  displayName?: string;
  toJSON?: () => any;
  [key: string]: any;
}

interface MockCreateRequest {
  email?: string;
  password?: string;
  displayName?: string;
  [key: string]: any;
}

// Define a type for the mocked auth object
interface MockAdminAuth {
  createUser: jest.Mock<Promise<any>, [any]>;
  updateUser: jest.Mock<Promise<any>, [string, any]>;
  verifyIdToken: jest.Mock<Promise<any>, [string, boolean?]>;
  createCustomToken: jest.Mock<Promise<string>, [string, object?]>;
  getUser: jest.Mock<Promise<any>, [string]>;
  getUserByEmail: jest.Mock<Promise<any>, [string]>;
  deleteUser: jest.Mock<Promise<void>, [string]>;
}

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  // Create mock objects inside the mock factory to avoid reference errors
  const mockAuth = {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    deleteUser: jest.fn(),
  };

  // Mock app object with methods that return our mock services
  const mockFirestore = {};
  const mockStorage = {};

  const mockApp = {
    name: 'test-app',
    auth: jest.fn(() => mockAuth),
    firestore: jest.fn(() => mockFirestore),
    storage: jest.fn(() => mockStorage),
  };

  // Create the admin mocks with a _mutableApps property to allow tests to manipulate the apps array
  const _mutableApps: Array<any> = [];

  const adminMock = {
    initializeApp: jest.fn(() => mockApp),
    credential: {
      cert: jest.fn(),
    },
    app: jest.fn(() => mockApp),
    // Use a getter for apps that returns a copy of _mutableApps
    get apps() {
      return [..._mutableApps];
    },
    // A helper for tests to modify the apps array
    _setApps(apps: Array<any>) {
      _mutableApps.length = 0; // Clear current apps
      _mutableApps.push(...apps); // Add new apps
    },
    auth: mockAuth,
    firestore: mockFirestore,
    storage: mockStorage,
  };

  return adminMock;
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// eslint-disable-next-line max-lines-per-function
describe('FirebaseAdminService', () => {
  let service: FirebaseAdminServiceImpl;
  let originalEnv: NodeJS.ProcessEnv;
  let mockAuth: MockAdminAuth;
  let mockApp: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();

    // Get references to mocked objects
    mockAuth = admin.auth as unknown as MockAdminAuth;
    mockApp = admin.app();

    // Reset admin.apps for each test
    (admin as any)._setApps([]);

    // Set up credential cert mock to return a credential
    (admin.credential.cert as jest.Mock).mockReturnValue('mock-cert-credential');

    // Configure credentials
    process.env.FIREBASE_PROJECT_ID = 'test-project-id';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'real-private-key';

    // Set NEXT_PUBLIC_IS_E2E_TEST_ENV to false to prevent using emulator config
    process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'false';

    // Set up test environment
    (process.env as any).NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with environment credentials', () => {
      // Create a new instance for this test
      service = new FirebaseAdminServiceImpl();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project-id',
        clientEmail: 'test@example.com',
        privateKey: 'real-private-key',
      });
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: 'mock-cert-credential',
      });
    });

    it('should initialize with service account JSON if provided', () => {
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON = JSON.stringify({
        projectId: 'json-project-id',
        clientEmail: 'json@example.com',
        privateKey: 'json-private-key',
      });

      // Create a new instance for this test
      service = new FirebaseAdminServiceImpl();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'json-project-id',
        clientEmail: 'json@example.com',
        privateKey: 'json-private-key',
      });
    });

    it('should recognize existing Firebase app', () => {
      // Set up existing app
      const mockExistingApp = { name: 'existing-app' };
      (admin as any)._setApps([mockExistingApp]);

      // Reset mocks to ensure a clean slate for call tracking
      jest.clearAllMocks();

      // Create the service which should detect existing app
      service = new FirebaseAdminServiceImpl();

      // Verify expected behavior
      expect(admin.app).toHaveBeenCalled();
      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin' }),
        expect.stringContaining('Firebase Admin SDK already initialized')
      );
    });
  });

  describe('service methods', () => {
    beforeEach(() => {
      // Create service instance for each test
      service = new FirebaseAdminServiceImpl();

      // Manually set the internal app property for successful initialization
      (service as any).app = mockApp;

      // Mock isInitialized to return true for all methods
      jest.spyOn(service, 'isInitialized').mockReturnValue(true);
    });

    it('should check initialization status', () => {
      const isInitialized = service.isInitialized();
      expect(isInitialized).toBe(true);
    });

    it('should get auth instance', () => {
      const auth = service.getAuth();
      expect(mockApp.auth).toHaveBeenCalled();
      expect(auth).toBe(mockAuth);
    });

    it('should get firestore instance', () => {
      const firestore = service.getFirestore();
      expect(mockApp.firestore).toHaveBeenCalled();
      expect(firestore).toBe(admin.firestore);
    });

    it('should get storage instance', () => {
      const storage = service.getStorage();
      expect(mockApp.storage).toHaveBeenCalled();
      expect(storage).toBe(admin.storage);
    });

    it('should create a user', async () => {
      const userData: MockCreateRequest = {
        email: 'user@example.com',
        password: 'password123',
      };
      const mockUserRecord: MockUserRecord = {
        uid: 'user123',
        email: 'user@example.com',
      };
      mockAuth.createUser.mockResolvedValue(mockUserRecord);

      const result = await service.createUser(userData);

      expect(mockAuth.createUser).toHaveBeenCalledWith(userData);
      expect(result).toBe(mockUserRecord);
    });

    it('should update a user', async () => {
      const userId = 'user123';
      const updates = { displayName: 'Updated Name' };
      const mockUserRecord = { uid: userId, displayName: 'Updated Name' };
      mockAuth.updateUser.mockResolvedValue(mockUserRecord);

      const result = await service.updateUser(userId, updates);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(userId, updates);
      expect(result).toBe(mockUserRecord);
    });

    it('should verify an ID token', async () => {
      const token = 'valid-token';
      const decodedToken = { uid: 'user123', email: 'user@example.com' };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      const result = await service.verifyIdToken(token);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(token, undefined);
      expect(result).toBe(decodedToken);
    });

    it('should create a custom token', async () => {
      const userId = 'user123';
      const claims = { admin: true };
      const customToken = 'custom-token-123';
      mockAuth.createCustomToken.mockResolvedValue(customToken);

      const result = await service.createCustomToken(userId, claims);

      expect(mockAuth.createCustomToken).toHaveBeenCalledWith(userId, claims);
      expect(result).toBe(customToken);
    });

    it('should get a user by ID', async () => {
      const userId = 'user123';
      const mockUserRecord = { uid: userId, email: 'user@example.com' };
      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const result = await service.getUser(userId);

      expect(mockAuth.getUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserRecord);
    });

    it('should get a user by email', async () => {
      const email = 'user@example.com';
      const mockUserRecord = { uid: 'user123', email };
      mockAuth.getUserByEmail.mockResolvedValue(mockUserRecord);

      const result = await service.getUserByEmail(email);

      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(mockUserRecord);
    });

    it('should delete a user', async () => {
      const userId = 'user-to-delete';
      mockAuth.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(mockAuth.deleteUser).toHaveBeenCalledWith(userId);
    });
  });
});
