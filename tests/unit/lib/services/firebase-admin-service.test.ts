/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import * as pino from 'pino';
import {
  createFirebaseAdminMocks,
  resetFirebaseAdminMocks,
} from '../../../mocks/firebase/adminMocks'; // Corrected path
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service'; // ADDED IMPORT

// Define types for our mocks
// Removed unused FirebaseUserRecord and FirebaseAuthError interfaces

const {
  verifyIdTokenMock,
  getUserMock,
  getUserByEmailMock,
  createUserMock,
  updateUserMock,
  deleteUserMock,
  createCustomTokenMock,
  setupFirebaseAdminMock,
  listUsersMock,
  setCustomUserClaimsMock,
} = createFirebaseAdminMocks();

setupFirebaseAdminMock();

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

describe('FirebaseAdminServiceImpl', () => {
  let service: FirebaseAdminService;
  const originalEnv = { ...process.env };
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();
    resetFirebaseAdminMocks();
    process.env = { ...originalEnv };
    process.env.FIREBASE_PROJECT_ID = 'test-project';

    mockApp = {
      name: 'mockApp',
      options: { projectId: 'test-project' },
      auth: jest.fn(() => ({
        createUser: createUserMock,
        getUser: getUserMock,
        updateUser: updateUserMock,
        getUserByEmail: getUserByEmailMock,
        deleteUser: deleteUserMock,
        createCustomToken: createCustomTokenMock,
        verifyIdToken: verifyIdTokenMock,
        listUsers: listUsersMock,
        setCustomUserClaims: setCustomUserClaimsMock,
      })),
      firestore: jest.fn(() => ({ collection: jest.fn() })),
      storage: jest.fn(() => ({ bucket: jest.fn() })),
    };

    service = new FirebaseAdminService(mockApp, mockLogger);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('createUser', () => {
    it('should call app.auth().createUser with properties', async () => {
      const props = { email: 'new@example.com', password: 'password' };
      const expectedUserRecord = { uid: 'new-uid', email: 'new@example.com' } as any;

      createUserMock.mockResolvedValueOnce(expectedUserRecord);

      const result = await service.createUser(props);

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(createUserMock).toHaveBeenCalledTimes(1);
      expect(createUserMock).toHaveBeenCalledWith(props);
      expect(result).toEqual(expectedUserRecord);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { uid: 'new-uid', email: 'new@example.com' },
        'Successfully created user in Firebase Auth'
      );
    });

    it('should throw and log error if app.auth().createUser fails', async () => {
      const props = { email: 'fail@example.com', password: 'password' };
      const errorMessage = 'Failed to create user';
      createUserMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.createUser(props)).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(createUserMock).toHaveBeenCalledWith(props);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), email: props.email },
        'Failed to create user in Firebase Auth'
      );
    });
  });

  describe('getUser', () => {
    it('should call app.auth().getUser with uid', async () => {
      const uid = 'test-uid';
      const expectedUserRecord = { uid, email: 'user@example.com' } as any;
      getUserMock.mockResolvedValueOnce(expectedUserRecord);

      const result = await service.getUser(uid);

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(getUserMock).toHaveBeenCalledTimes(1);
      expect(getUserMock).toHaveBeenCalledWith(uid);
      expect(result).toEqual(expectedUserRecord);
    });
  });

  describe('getUserByEmail', () => {
    it('should call app.auth().getUserByEmail and return user', async () => {
      const email = 'user@example.com';
      const expectedUserRecord = { uid: 'test-uid', email } as any;
      getUserByEmailMock.mockResolvedValueOnce(expectedUserRecord);

      const result = await service.getUserByEmail(email);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(getUserByEmailMock).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedUserRecord);
    });

    it('should throw and log error if app.auth().getUserByEmail fails', async () => {
      const email = 'nonexistent@example.com';
      const errorMessage = 'User not found';
      getUserByEmailMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getUserByEmail(email)).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(getUserByEmailMock).toHaveBeenCalledWith(email);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), email },
        'Error getting Firebase user by email'
      );
    });
  });

  describe('getAuth', () => {
    it('should return the auth instance from the provided app', () => {
      const authInstance = service.getAuth();
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(authInstance).toEqual({
        createUser: createUserMock,
        getUser: getUserMock,
        updateUser: updateUserMock,
        getUserByEmail: getUserByEmailMock,
        deleteUser: deleteUserMock,
        createCustomToken: createCustomTokenMock,
        verifyIdToken: verifyIdTokenMock,
        listUsers: listUsersMock,
        setCustomUserClaims: setCustomUserClaimsMock,
      });
    });
  });

  describe('isInitialized', () => {
    it('should return true if app is provided', () => {
      expect(service.isInitialized()).toBe(true);
    });

    it('should return false if app is not provided (simulated)', () => {
      // Simulate a service initialized without a proper app
      const serviceWithoutApp = new FirebaseAdminService(null as any, mockLogger);
      expect(serviceWithoutApp.isInitialized()).toBe(false);
    });
  });

  describe('getFirestore', () => {
    it('should return the firestore instance from the provided app', () => {
      const firestoreInstance = service.getFirestore();
      expect(mockApp.firestore).toHaveBeenCalledTimes(1);
      expect(firestoreInstance).toBeDefined();
      expect(typeof firestoreInstance.collection).toBe('function');
    });
  });

  describe('listUsers', () => {
    it('should call app.auth().listUsers and return users', async () => {
      const mockUserResults = {
        users: [{ uid: 'user1' }, { uid: 'user2' }] as any[],
        pageToken: undefined,
      };
      listUsersMock.mockResolvedValueOnce(mockUserResults);

      const result = await service.listUsers();

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(listUsersMock).toHaveBeenCalledTimes(1);
      expect(listUsersMock).toHaveBeenCalledWith(1000, undefined);
      expect(result).toEqual(mockUserResults);
    });

    it('should call app.auth().listUsers with pageToken and maxResults', async () => {
      const mockUserResults = {
        users: [{ uid: 'user3' }] as any[],
        pageToken: 'nextPageToken',
      };
      listUsersMock.mockResolvedValueOnce(mockUserResults);

      const result = await service.listUsers(100, 'startToken');

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(listUsersMock).toHaveBeenCalledTimes(1);
      expect(listUsersMock).toHaveBeenCalledWith(100, 'startToken');
      expect(result).toEqual(mockUserResults);
    });

    it('should throw an error if app.auth().listUsers fails', async () => {
      const errorMessage = 'Failed to list users';
      listUsersMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.listUsers()).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(listUsersMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('setCustomUserClaims', () => {
    it('should call app.auth().setCustomUserClaims with uid and claims', async () => {
      const uid = 'test-uid';
      const claims = { admin: true };
      setCustomUserClaimsMock.mockResolvedValueOnce(undefined);

      await service.setCustomClaims(uid, claims); // Service method is setCustomClaims

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(setCustomUserClaimsMock).toHaveBeenCalledTimes(1);
      expect(setCustomUserClaimsMock).toHaveBeenCalledWith(uid, claims);
    });

    it('should throw an error if app.auth().setCustomUserClaims fails', async () => {
      const uid = 'test-uid';
      const claims = { admin: true };
      const errorMessage = 'Failed to set custom claims';
      setCustomUserClaimsMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.setCustomClaims(uid, claims)).rejects.toThrow(errorMessage); // Service method is setCustomClaims
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(setCustomUserClaimsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStorage', () => {
    it('should return the storage instance from the provided app', () => {
      const storageInstance = service.getStorage();
      expect(mockApp.storage).toHaveBeenCalledTimes(1);
      expect(storageInstance).toBeDefined();
      // Add a more specific check if the mockApp.storage().bucket is also a mock
      // For now, just checking if it's defined and storage() was called is okay.
      expect(typeof storageInstance.bucket).toBe('function');
    });
  });

  describe('deleteUser', () => {
    it('should call app.auth().deleteUser with uid and log success', async () => {
      const uid = 'delete-me-uid';
      deleteUserMock.mockResolvedValueOnce(undefined);

      await service.deleteUser(uid);

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(mockLogger.info).toHaveBeenCalledWith({ uid }, 'Successfully deleted Firebase user');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw an error and log error if app.auth().deleteUser fails', async () => {
      const uid = 'delete-me-uid-fail';
      const errorMessage = 'Failed to delete user';
      deleteUserMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.deleteUser(uid)).rejects.toThrow(errorMessage);

      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), uid },
        'Error deleting Firebase user'
      );
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Successfully deleted')
      );
    });
  });

  describe('updateUser', () => {
    it('should call app.auth().updateUser and return updated user', async () => {
      const uid = 'test-uid';
      const updates = { displayName: 'New Name' };
      const expectedUserRecord = { uid, displayName: 'New Name' } as any;
      updateUserMock.mockResolvedValueOnce(expectedUserRecord);

      const result = await service.updateUser(uid, updates);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(updateUserMock).toHaveBeenCalledWith(uid, updates);
      expect(result).toEqual(expectedUserRecord);
    });

    it('should throw and log error if app.auth().updateUser fails', async () => {
      const uid = 'test-uid-fail';
      const updates = { displayName: 'New Name' };
      const errorMessage = 'Failed to update user';
      updateUserMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.updateUser(uid, updates)).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(updateUserMock).toHaveBeenCalledWith(uid, updates);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), uid },
        'Error updating Firebase user'
      );
    });
  });

  describe('verifyIdToken', () => {
    it('should call app.auth().verifyIdToken and return decoded token', async () => {
      const idToken = 'test-token';
      const expectedDecodedToken = { uid: 'decoded-uid' } as any;
      verifyIdTokenMock.mockResolvedValueOnce(expectedDecodedToken);

      const result = await service.verifyIdToken(idToken);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken);
      expect(result).toEqual(expectedDecodedToken);
      expect(mockLogger.trace).toHaveBeenCalledWith(
        { uid: 'decoded-uid' },
        'Firebase ID token verified successfully'
      );
    });

    it('should throw and log error if app.auth().verifyIdToken fails', async () => {
      const idToken = 'invalid-token';
      const errorMessage = 'Invalid ID token';
      verifyIdTokenMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.verifyIdToken(idToken)).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Firebase ID token verification failed'
      );
    });
  });

  describe('createCustomToken', () => {
    it('should call app.auth().createCustomToken and return token', async () => {
      const uid = 'test-uid';
      const claims = { premium: true };
      const expectedToken = 'custom-jwt-token';
      createCustomTokenMock.mockResolvedValueOnce(expectedToken);

      const result = await service.createCustomToken(uid, claims);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, claims);
      expect(result).toEqual(expectedToken);
    });

    it('should call app.auth().createCustomToken without claims if not provided', async () => {
      const uid = 'test-uid-no-claims';
      const expectedToken = 'custom-jwt-token-no-claims';
      createCustomTokenMock.mockResolvedValueOnce(expectedToken);

      const result = await service.createCustomToken(uid);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, undefined); // Ensure claims is undefined
      expect(result).toEqual(expectedToken);
    });

    // Note: The service method doesn't have explicit try/catch,
    // so testing error path relies on the mock rejecting, which is standard.
    it('should throw if app.auth().createCustomToken fails', async () => {
      const uid = 'test-uid-fail';
      const errorMessage = 'Failed to create custom token';
      createCustomTokenMock.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.createCustomToken(uid)).rejects.toThrow(errorMessage);
      expect(mockApp.auth).toHaveBeenCalledTimes(1);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, undefined);
    });
  });
});
