/**
 * @jest-environment node
 */

import * as admin from 'firebase-admin';
import { FirebaseAdminServiceImpl } from './firebase-admin.service';
import { logger } from '@/lib/logger';

// Define a type for the mocked auth object
type MockAdminAuth = {
  createUser: jest.Mock<Promise<any>, [any]>;
  updateUser: jest.Mock<Promise<any>, [string, any]>;
  verifyIdToken: jest.Mock<Promise<any>, [string, boolean?]>;
  createCustomToken: jest.Mock<Promise<string>, [string, object?]>;
  getUser: jest.Mock<Promise<any>, [string]>;
  getUserByEmail: jest.Mock<Promise<any>, [string]>;
  deleteUser: jest.Mock<Promise<void>, [string]>;
};

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const mockAuth = {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockFirestore = {};
  const mockStorage = {};

  const mockApp = {
    name: 'test-app',
    auth: jest.fn(() => mockAuth),
    firestore: jest.fn(() => mockFirestore),
    storage: jest.fn(() => mockStorage),
  };

  return {
    initializeApp: jest.fn(() => mockApp),
    credential: {
      cert: jest.fn(() => 'mock-cert-credential'),
    },
    app: jest.fn(() => mockApp),
    apps: [],
    auth: mockAuth,
    firestore: mockFirestore,
    storage: mockStorage,
  };
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

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    (admin.apps as any) = [];
    (admin.credential.cert as jest.Mock).mockReturnValue('mock-cert-credential');

    process.env.FIREBASE_PROJECT_ID = 'test-project-id';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should initialize with environment credentials', () => {
      process.env.FIREBASE_PRIVATE_KEY = 'real-private-key';
      (process.env as any).NODE_ENV = 'production';

      service = new FirebaseAdminServiceImpl();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project-id',
        clientEmail: 'test@example.com',
        privateKey: 'real-private-key',
      });
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: 'mock-cert-credential',
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin', projectId: 'test-project-id' }),
        expect.stringContaining('Attempting to initialize with explicit')
      );
    });

    it('should initialize with service account JSON if provided', () => {
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON = JSON.stringify({
        projectId: 'json-project-id',
        clientEmail: 'json@example.com',
        privateKey: 'json-private-key',
      });

      service = new FirebaseAdminServiceImpl();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'json-project-id',
        clientEmail: 'json@example.com',
        privateKey: 'json-private-key',
      });
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: 'mock-cert-credential',
      });
    });

    it('should fall back to ADC if no credentials are provided', () => {
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

      service = new FirebaseAdminServiceImpl();

      expect(admin.initializeApp).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin', projectId: 'test-project-id' }),
        expect.stringContaining('Attempting Application Default Credentials')
      );
    });

    it('should handle test environment correctly', () => {
      (process.env as any).NODE_ENV = 'test';

      service = new FirebaseAdminServiceImpl();

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin' }),
        expect.stringContaining('Test or E2E environment detected')
      );
      expect(admin.initializeApp).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
    });

    it('should recognize existing Firebase app', () => {
      (admin.apps as any) = ['existing-app'];

      service = new FirebaseAdminServiceImpl();

      expect(admin.app).toHaveBeenCalled();
      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin' }),
        expect.stringContaining('Firebase Admin SDK already initialized')
      );
    });

    it('should handle initialization failure gracefully', () => {
      (admin.initializeApp as jest.Mock).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      service = new FirebaseAdminServiceImpl();

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'firebase-admin', err: expect.any(Error) }),
        expect.stringContaining('Failed to initialize Firebase Admin SDK')
      );
    });
  });

  describe('service methods', () => {
    beforeEach(() => {
      service = new FirebaseAdminServiceImpl();

      (service as any).app = (admin as any).app();
    });

    it('should check initialization status', () => {
      const isInitialized = service.isInitialized();

      expect(isInitialized).toBe(true);
    });

    it('should get auth instance', () => {
      const auth = service.getAuth();

      expect((admin as any).app().auth).toHaveBeenCalled();
      expect(auth).toBe((admin as any).auth);
    });

    it('should get firestore instance', () => {
      const firestore = service.getFirestore();

      expect((admin as any).app().firestore).toHaveBeenCalled();
      expect(firestore).toBe((admin as any).firestore);
    });

    it('should get storage instance', () => {
      const storage = service.getStorage();

      expect((admin as any).app().storage).toHaveBeenCalled();
      expect(storage).toBe((admin as any).storage);
    });

    it('should create a user', async () => {
      const userData = { email: 'user@example.com', password: 'password123' };
      const mockUserRecord = { uid: 'user123', email: 'user@example.com' };
      (admin.auth as unknown as MockAdminAuth).createUser.mockResolvedValue(mockUserRecord);

      const result = await service.createUser(userData);

      expect((admin.auth as unknown as MockAdminAuth).createUser).toHaveBeenCalledWith(userData);
      expect(result).toBe(mockUserRecord);
    });

    it('should update a user', async () => {
      const userId = 'user123';
      const updates = { displayName: 'Updated Name' };
      const mockUserRecord = { uid: userId, displayName: 'Updated Name' };
      (admin.auth as unknown as MockAdminAuth).updateUser.mockResolvedValue(mockUserRecord);

      const result = await service.updateUser(userId, updates);

      expect((admin.auth as unknown as MockAdminAuth).updateUser).toHaveBeenCalledWith(
        userId,
        updates
      );
      expect(result).toBe(mockUserRecord);
    });

    it('should verify an ID token', async () => {
      const token = 'valid-token';
      const decodedToken = { uid: 'user123', email: 'user@example.com' };
      (admin.auth as unknown as MockAdminAuth).verifyIdToken.mockResolvedValue(decodedToken);

      const result = await service.verifyIdToken(token);

      expect((admin.auth as unknown as MockAdminAuth).verifyIdToken).toHaveBeenCalledWith(
        token,
        undefined
      );
      expect(result).toBe(decodedToken);
    });

    it('should create a custom token', async () => {
      const userId = 'user123';
      const claims = { admin: true };
      const customToken = 'custom-token-123';
      (admin.auth as unknown as MockAdminAuth).createCustomToken.mockResolvedValue(customToken);

      const result = await service.createCustomToken(userId, claims);

      expect((admin.auth as unknown as MockAdminAuth).createCustomToken).toHaveBeenCalledWith(
        userId,
        claims
      );
      expect(result).toBe(customToken);
    });

    it('should get a user by ID', async () => {
      const userId = 'user123';
      const mockUserRecord = { uid: userId, email: 'user@example.com' };
      (admin.auth as unknown as MockAdminAuth).getUser.mockResolvedValue(mockUserRecord);

      const result = await service.getUser(userId);

      expect((admin.auth as unknown as MockAdminAuth).getUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserRecord);
    });

    it('should get a user by email', async () => {
      const email = 'user@example.com';
      const mockUserRecord = { uid: 'user123', email };
      (admin.auth as unknown as MockAdminAuth).getUserByEmail.mockResolvedValue(mockUserRecord);

      const result = await service.getUserByEmail(email);

      expect((admin.auth as unknown as MockAdminAuth).getUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(mockUserRecord);
    });

    it('should delete a user', async () => {
      const userId = 'user123';
      (admin.auth as unknown as MockAdminAuth).deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect((admin.auth as unknown as MockAdminAuth).deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should handle API errors and parse them correctly', async () => {
      const userId = 'invalid-user';
      const apiError = new Error('User not found');
      (apiError as any).code = 'auth/user-not-found';
      (admin.auth as unknown as MockAdminAuth).getUser.mockRejectedValue(apiError);

      await expect(service.getUser(userId)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'firebase-admin',
          method: 'getUser',
          errorCode: 'auth/user-not-found',
        }),
        expect.stringContaining('Firebase Admin SDK operation failed')
      );
    });
  });
});
