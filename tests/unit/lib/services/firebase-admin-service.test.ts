/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import * as admin from 'firebase-admin'; // For types and for the service's internal import
import * as pino from 'pino';

// Import the factory and mock functions from adminMocks
import {
  createFirebaseAdminMocks,
  // Individual mocks are not typically needed here if using authMethodsMockObject for setup
  // and asserting on its properties via the returned auth instance.
} from '../../../mocks/firebase/adminMocks';

// --- Create all mocks needed for the top-level firebase-admin mock ---
// We get them from the factory, so they are the same instances as used elsewhere.
const {
  initializeAppMock,
  getAppMock,
  getAppsMock,
  getAuthMock, // This is the factory that returns authMethodsMockObject
  appInstanceMock, // The mock app instance
  authMethodsMockObject, // The object with all auth methods, returned by getAuthMock
  resetFirebaseAdminMocks, // Utility to reset them all

  // Destructure individual mocks if needed for direct assertion on them in this file
  // (though typically assertions will be on authMethodsMockObject.createUserMock etc.)
  verifyIdTokenMock,
  createUserMock, // Example, if you wanted to assert createUserMock was called
  getUserMock,
  getUserByEmailMock,
  updateUserMock,
  deleteUserMock,
  createCustomTokenMock,
  listUsersMock,
  setCustomUserClaimsMock,
  createSessionCookieMock,
} = createFirebaseAdminMocks();

// === Top-level mock for 'firebase-admin' ===
// This MUST be at the top, before FirebaseAdminService is imported.
jest.mock('firebase-admin', () => {
  // console.log('[DEBUG] Top-level firebase-admin mock FACTORY CALLED'); // Removed
  return {
    __esModule: true, // If firebase-admin uses ES modules
    initializeApp: initializeAppMock,
    app: jest.fn((name?: string) => (name ? getAppMock(name) : appInstanceMock)),
    apps: getAppsMock(), // apps is a property (readonly FirebaseApp[]), not a function
    auth: getAuthMock, // admin.auth() will call getAuthMock, which returns authMethodsMockObject
    credential: {
      cert: jest.fn().mockReturnValue({ type: 'mocked-cert' }), // Mock credentials if service uses it
    },
    // Add other admin SDK parts if your service directly uses them, e.g., firestore, storage
  };
});
// === End Top-level Mock ===

// Now import the service under test. It will pick up the above mock.
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';

// Define spies for the logger methods we want to assert on
const mockLoggerErrorFn = jest.fn();
const mockLoggerInfoFn = jest.fn();
const mockLoggerWarnFn = jest.fn();
const mockLoggerDebugFn = jest.fn();
const mockLoggerTraceFn = jest.fn();

// Simple pino-like mock that supports .child().<method>()
const mockLogger = {
  trace: mockLoggerTraceFn,
  debug: mockLoggerDebugFn,
  info: mockLoggerInfoFn,
  warn: mockLoggerWarnFn,
  error: mockLoggerErrorFn,
  child: jest.fn().mockImplementation(() => mockLogger),
} as unknown as pino.Logger;

describe('FirebaseAdminServiceImpl', () => {
  let service: FirebaseAdminService;

  beforeEach(() => {
    resetFirebaseAdminMocks(); // Clears all mocks, including auth method mocks

    // Clear our logger spies
    mockLoggerErrorFn.mockClear();
    mockLoggerInfoFn.mockClear();
    mockLoggerWarnFn.mockClear();
    mockLoggerDebugFn.mockClear();
    mockLoggerTraceFn.mockClear();
    (mockLogger.child as jest.Mock).mockClear(); // Clear calls to child itself

    // Re-ensure child returns mockLogger itself
    (mockLogger.child as jest.Mock).mockImplementation(() => mockLogger);

    service = FirebaseAdminService.createTestInstance(
      authMethodsMockObject as unknown as admin.auth.Auth, // Cast to satisfy Auth type
      mockLogger
    );
    // Add this log:
    // console.log( // Removed
    //   '[DEBUG] firebase-admin-service.test.ts: Is authMethodsMockObject.getUser === getUserMock? ',
    //   authMethodsMockObject.getUser === getUserMock
    // );
  });

  describe('getInstance', () => {
    let mockGetFirebaseAdminApp: jest.Mock;
    let mockAppFromGetAdminApp: { auth: jest.Mock };

    beforeEach(() => {
      // Reset the singleton instance before each test in this block
      (FirebaseAdminService as any).instance = null;

      // Prepare a mock app that getFirebaseAdminApp will return
      // This mock app needs an auth() method that returns our main authMethodsMockObject
      mockAppFromGetAdminApp = {
        auth: jest.fn().mockReturnValue(authMethodsMockObject),
        // Add other app properties if needed by the FirebaseAdminService constructor
        // name: 'mock-app-from-getFirebaseAdminApp' // Example
      };

      mockGetFirebaseAdminApp = jest.fn().mockReturnValue(mockAppFromGetAdminApp);

      // Mock the getFirebaseAdminApp module specifically for these getInstance tests
      // This is separate from the top-level 'firebase-admin' mock
      jest.doMock('@/lib/firebase/firebase-admin', () => ({
        getFirebaseAdminApp: mockGetFirebaseAdminApp,
      }));

      // We need to re-require FirebaseAdminService *after* the doMock for getFirebaseAdminApp
      // if getInstance itself is not static or if its module has already been loaded
      // However, since getInstance IS static and we reset its internal static 'instance' property,
      // and the constructor uses the (now mocked) getFirebaseAdminApp, this should be okay.
      // If issues arise, use jest.isolateModules or resetModules + require.
    });

    afterEach(() => {
      // Clean up the specific mock for getFirebaseAdminApp to not interfere with other tests
      jest.unmock('@/lib/firebase/firebase-admin');
      // Alternatively, if using jest.isolateModules, this cleanup is usually automatic.
    });

    it('should create a new instance if one does not exist, using getFirebaseAdminApp', () => {
      // Act
      let serviceInstance: FirebaseAdminService;
      let FreshFirebaseAdminServiceClass: typeof FirebaseAdminService;

      jest.isolateModules(() => {
        const {
          FirebaseAdminService: IsolatedFirebaseAdminService,
        } = require('@/lib/services/firebase-admin-service');
        FreshFirebaseAdminServiceClass = IsolatedFirebaseAdminService;
        (FreshFirebaseAdminServiceClass as any).instance = null;
        serviceInstance = FreshFirebaseAdminServiceClass.getInstance(mockLogger);
      });

      // Assert
      expect(mockGetFirebaseAdminApp).toHaveBeenCalledTimes(1);
      expect(mockAppFromGetAdminApp.auth).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(serviceInstance).toBeInstanceOf(FreshFirebaseAdminServiceClass); // Use the isolated class definition
      // @ts-ignore
      expect(serviceInstance.getAuth()).toBe(authMethodsMockObject);
      expect(mockLoggerInfoFn).toHaveBeenCalledWith(
        expect.stringContaining('FirebaseAdminService new instance created via getInstance')
      );
    });

    it('should throw an error if authInstance is not available', () => {
      // Arrange: service is already created in beforeEach using createTestInstance
      // Manually nullify the authInstance to simulate a failure state
      (service as any).authInstance = null;

      // Act & Assert
      expect(() => service.getAuth()).toThrow('FirebaseAdminService: Auth instance not available.');
      expect(mockLoggerErrorFn).toHaveBeenCalledWith('Auth instance not initialized!');
    });

    it('should return the existing instance on subsequent calls', () => {
      let firstInstance: FirebaseAdminService;
      let secondInstance: FirebaseAdminService;

      jest.isolateModules(() => {
        const {
          FirebaseAdminService: FreshFirebaseAdminService,
        } = require('@/lib/services/firebase-admin-service');
        (FreshFirebaseAdminService as any).instance = null;
        firstInstance = FreshFirebaseAdminService.getInstance(mockLogger);
        secondInstance = FreshFirebaseAdminService.getInstance(mockLogger);
      });

      // Assert
      expect(mockGetFirebaseAdminApp).toHaveBeenCalledTimes(1); // Should only be called once for the first instance
      // @ts-ignore
      expect(secondInstance).toBe(firstInstance);
    });
  });

  // Tests remain the same...
  describe('isInitialized', () => {
    it('should return true when service is created with createTestInstance', () => {
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('getAuth', () => {
    it('should return the mocked auth instance directly set by createTestInstance', () => {
      const authInstance = service.getAuth();
      // It should be the exact same object instance passed to createTestInstance
      expect(authInstance).toBe(authMethodsMockObject);
      // And its methods should be our mocks
      expect(authInstance.createUser).toBe(createUserMock);
    });
  });

  describe('createUser', () => {
    const props: admin.auth.CreateRequest = { email: 'test@example.com', password: 'password' };
    const mockUserRecord = { uid: '123', email: props.email } as admin.auth.UserRecord;

    it('should call the mocked createUser on authMethodsMockObject and log success', async () => {
      createUserMock.mockResolvedValue(mockUserRecord);
      const result = await service.createUser(props);
      expect(createUserMock).toHaveBeenCalledWith(props);
      expect(mockLoggerInfoFn).toHaveBeenCalledWith(
        expect.objectContaining({ uid: mockUserRecord.uid, email: props.email }),
        'Successfully created user in Firebase Auth'
      );
      expect(result).toBe(mockUserRecord);
    });

    it('should throw and log error if createUserMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to create user';
      createUserMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.createUser(props)).rejects.toThrow(errorMessage);
      expect(createUserMock).toHaveBeenCalledWith(props);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), email: props.email }),
        'Failed to create user in Firebase Auth'
      );
    });
  });

  describe('getUser', () => {
    const uid = 'user-uid';
    const mockUserRecord = { uid, email: 'user@example.com' } as admin.auth.UserRecord;

    it('should call the mocked getUser on authMethodsMockObject', async () => {
      getUserMock.mockResolvedValue(mockUserRecord);
      const result = await service.getUser(uid);
      expect(getUserMock).toHaveBeenCalledWith(uid);
      expect(result).toBe(mockUserRecord);
    });

    it('should throw and log error if getUserMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to get user';
      getUserMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.getUser(uid)).rejects.toThrow(errorMessage);
      expect(getUserMock).toHaveBeenCalledWith(uid);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), uid }),
        'Error getting Firebase user'
      );
    });
  });

  describe('getUserByEmail', () => {
    const email = 'user@example.com';
    const mockUserRecord = { uid: '123', email } as admin.auth.UserRecord;

    it('should call the mocked getUserByEmail on authMethodsMockObject', async () => {
      getUserByEmailMock.mockResolvedValue(mockUserRecord);
      const result = await service.getUserByEmail(email);
      expect(getUserByEmailMock).toHaveBeenCalledWith(email);
      expect(result).toBe(mockUserRecord);
    });

    it('should throw and log error if getUserByEmailMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'User not found';
      getUserByEmailMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.getUserByEmail(email)).rejects.toThrow(errorMessage);
      expect(getUserByEmailMock).toHaveBeenCalledWith(email);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), email }),
        'Error getting Firebase user by email'
      );
    });
  });

  describe('listUsers', () => {
    const mockListUsersResult = { users: [], pageToken: undefined } as admin.auth.ListUsersResult;

    it('should call the mocked listUsers on authMethodsMockObject', async () => {
      listUsersMock.mockResolvedValue(mockListUsersResult);
      const result = await service.listUsers();
      expect(listUsersMock).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toBe(mockListUsersResult);
    });

    it('should call the mocked listUsers on authMethodsMockObject with pageToken and maxResults', async () => {
      listUsersMock.mockResolvedValue(mockListUsersResult);
      const result = await service.listUsers(50, 'nextPageToken');
      expect(listUsersMock).toHaveBeenCalledWith(50, 'nextPageToken');
      expect(result).toBe(mockListUsersResult);
    });

    it('should throw an error if listUsersMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to list users';
      listUsersMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.listUsers()).rejects.toThrow(errorMessage);
      expect(listUsersMock).toHaveBeenCalledWith(undefined, undefined);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Error listing Firebase users'
      );
    });
  });

  describe('setCustomClaims (service method)', () => {
    const uid = 'user-uid';
    const claims = { admin: true };

    it('should call the mocked setCustomUserClaims on authMethodsMockObject', async () => {
      setCustomUserClaimsMock.mockResolvedValue(undefined);
      await service.setCustomClaims(uid, claims);
      expect(setCustomUserClaimsMock).toHaveBeenCalledWith(uid, claims);
    });

    it('should throw an error if setCustomUserClaimsMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to set custom claims';
      setCustomUserClaimsMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.setCustomClaims(uid, claims)).rejects.toThrow(errorMessage);
      expect(setCustomUserClaimsMock).toHaveBeenCalledWith(uid, claims);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), uid, claims }),
        'Error setting Firebase custom claims'
      );
    });
  });

  describe('deleteUser', () => {
    const uid = 'user-uid-to-delete';

    it('should call the mocked deleteUser on authMethodsMockObject and log success', async () => {
      deleteUserMock.mockResolvedValue(undefined);
      await service.deleteUser(uid);
      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(mockLoggerInfoFn).toHaveBeenCalledWith({ uid }, 'Successfully deleted Firebase user');
    });

    it('should throw an error and log error if deleteUserMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to delete user';
      deleteUserMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.deleteUser(uid)).rejects.toThrow(errorMessage);
      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), uid }),
        'Error deleting Firebase user'
      );
    });
  });

  describe('updateUser', () => {
    const uid = 'user-uid-to-update';
    const updates: { displayName?: string; photoURL?: string; email?: string } = {
      displayName: 'New Name',
    };
    const mockUserRecord = { uid, displayName: 'New Name' } as admin.auth.UserRecord;

    it('should call the mocked updateUser on authMethodsMockObject and return updated user', async () => {
      updateUserMock.mockResolvedValue(mockUserRecord);
      const result = await service.updateUser(uid, updates);
      expect(updateUserMock).toHaveBeenCalledWith(uid, updates);
      expect(result).toBe(mockUserRecord);
    });

    it('should throw and log error if updateUserMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to update user';
      updateUserMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.updateUser(uid, updates)).rejects.toThrow(errorMessage);
      expect(updateUserMock).toHaveBeenCalledWith(uid, updates);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error), uid }),
        'Error updating Firebase user'
      );
    });
  });

  describe('verifyIdToken', () => {
    const idToken = 'test-id-token';
    const mockDecodedToken = { uid: 'decoded-uid' } as admin.auth.DecodedIdToken;

    it('should call the mocked verifyIdToken on authMethodsMockObject', async () => {
      verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
      const result = await service.verifyIdToken(idToken);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken, undefined);
      expect(result).toBe(mockDecodedToken);
    });

    it('should throw and log error if verifyIdTokenMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Invalid ID token';
      verifyIdTokenMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.verifyIdToken(idToken)).rejects.toThrow(errorMessage);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken, undefined);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Firebase ID token verification failed'
      );
    });
  });

  describe('createCustomToken', () => {
    const uid = 'test-uid';
    const claims = { premium: true };
    const mockToken = 'mock-custom-token';

    it('should call the mocked createCustomToken on authMethodsMockObject', async () => {
      createCustomTokenMock.mockResolvedValue(mockToken);
      const result = await service.createCustomToken(uid, claims);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, claims);
      expect(result).toBe(mockToken);
    });

    it('should call the mocked createCustomToken on authMethodsMockObject without claims if not provided', async () => {
      createCustomTokenMock.mockResolvedValue(mockToken);
      await service.createCustomToken(uid);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, undefined);
    });

    it('should throw if createCustomTokenMock (from authMethodsMockObject) fails', async () => {
      const errorMessage = 'Failed to create custom token';
      createCustomTokenMock.mockRejectedValue(new Error(errorMessage));
      await expect(service.createCustomToken(uid)).rejects.toThrow(errorMessage);
      expect(createCustomTokenMock).toHaveBeenCalledWith(uid, undefined);
    });
  });

  describe('createSessionCookie', () => {
    const idToken = 'test-id-token';
    const options = { expiresIn: 3600000 }; // 1 hour in ms
    const mockSessionCookie = 'mock-session-cookie';
    const mockDecodedTokenForLog = { uid: 'logged-uid' } as admin.auth.DecodedIdToken;

    beforeEach(() => {
      // Clear relevant mocks before each test in this suite
      createSessionCookieMock.mockClear();
      verifyIdTokenMock.mockClear();
      mockLoggerInfoFn.mockClear();
      mockLoggerErrorFn.mockClear();
    });

    it('should create session cookie, log success, and return cookie', async () => {
      // Arrange
      createSessionCookieMock.mockResolvedValue(mockSessionCookie);
      // The success log path also calls verifyIdToken to get the UID for logging
      verifyIdTokenMock.mockResolvedValue(mockDecodedTokenForLog);

      // Act
      const result = await service.createSessionCookie(idToken, options);

      // Assert
      expect(createSessionCookieMock).toHaveBeenCalledWith(idToken, options);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken, undefined); // For the logger, checkRevoked is undefined at call site
      expect(mockLoggerInfoFn).toHaveBeenCalledWith(
        { uid: mockDecodedTokenForLog.uid, expiresInSeconds: options.expiresIn / 1000 },
        'Successfully created Firebase session cookie'
      );
      expect(result).toBe(mockSessionCookie);
    });

    it('should throw and log error if createSessionCookie on auth instance fails', async () => {
      // Arrange
      const errorMessage = 'Failed to create session cookie via auth instance';
      createSessionCookieMock.mockRejectedValue(new Error(errorMessage));
      // verifyIdTokenMock might still be called if error happens after it in SUT, but for this test path it shouldn't matter

      // Act & Assert
      await expect(service.createSessionCookie(idToken, options)).rejects.toThrow(errorMessage);
      expect(createSessionCookieMock).toHaveBeenCalledWith(idToken, options);
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Error creating Firebase session cookie'
      );
      // Ensure verifyIdToken was not called for logging if createSessionCookie itself failed
      expect(verifyIdTokenMock).not.toHaveBeenCalled();
    });

    it('should throw and log error if verifyIdToken (for logging) fails after successful cookie creation', async () => {
      // This tests a more specific failure scenario within the try block
      // Arrange
      createSessionCookieMock.mockResolvedValue(mockSessionCookie);
      const verifyErrorMessage = 'Failed to verify token for logging';
      verifyIdTokenMock.mockRejectedValue(new Error(verifyErrorMessage));

      // Act & Assert
      // The outer promise should still reject because verifyIdToken (for logging) fails
      await expect(service.createSessionCookie(idToken, options)).rejects.toThrow(
        verifyErrorMessage
      );
      expect(createSessionCookieMock).toHaveBeenCalledWith(idToken, options);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(idToken, undefined); // Called for logging, checkRevoked is undefined at call site
      expect(mockLoggerErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }), // This will be the verifyIdToken error
        'Error creating Firebase session cookie' // Generic message from the catch block
      );
      expect(mockLoggerInfoFn).not.toHaveBeenCalled(); // Success log should not happen
    });
  });
});
