// Mock firebase-admin before importing FirebaseAdminService
import * as admin from 'firebase-admin';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import type { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth'; // Use Auth type

// Mock the entire firebase-admin module
jest.mock('firebase-admin', () => ({
  // Use mockDeep to create mocks for sub-modules like auth()
  auth: mockDeep<() => admin.auth.Auth>(),
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
}));

import type * as pino from 'pino';
import { FirebaseAdminService } from '../../../lib/services/firebase-admin-service';

// Define mock types for Firebase Admin Auth methods more granularly
type MockAuth = DeepMockProxy<admin.auth.Auth> & {
  getUserByEmail: jest.Mock;
  updateUser: jest.Mock;
  createCustomToken: jest.Mock; // Added
  // Removed getUser, verifyIdToken
};

// Get typed access to the mocked admin functions/objects
const mockInitializeApp = admin.initializeApp as jest.Mock;
const mockAuth = admin.auth as jest.MockedFunction<() => MockAuth>; // Cast return type

// Mocks
const mockLogger = mockDeep<pino.Logger>();
const mockAdminAuthInstance = mockDeep<MockAuth>(); // The object returned by auth()

// --- Mocks --- //
const mockApp = mockDeep<App>();
const mockAuthInstance = mockDeep<Auth>(); // Mock the Auth instance

// Mock the getAuth function from firebase-admin/auth
jest.mock('firebase-admin/auth', () => ({
  __esModule: true,
  getAuth: jest.fn(() => mockAuthInstance),
}));

describe('FirebaseAdminService', () => {
  let firebaseAdminService: FirebaseAdminService;

  beforeEach(() => {
    mockReset(mockApp);
    mockReset(mockLogger);
    mockReset(mockAuth);
    mockReset(mockAdminAuthInstance);

    mockAuth.mockReturnValue(mockAdminAuthInstance);

    // Clear the mock for the getAuth factory function itself
    const { getAuth } = require('firebase-admin/auth');
    (getAuth as jest.Mock).mockClear();
    (getAuth as jest.Mock).mockReturnValue(mockAuthInstance); // Ensure it returns the mock

    firebaseAdminService = new FirebaseAdminService(mockApp, mockLogger);
  });

  it('should be defined', () => {
    expect(firebaseAdminService).toBeDefined();
  });

  it('should return the Auth instance, initializing it lazily on first call', () => {
    const { getAuth } = require('firebase-admin/auth');

    // First call
    const authInstance1 = firebaseAdminService.auth();
    expect(authInstance1).toBe(mockAuthInstance);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(mockApp); // Verify it was called with the injected app
    expect(mockLogger.trace).toHaveBeenCalledWith(
      'Initializing and getting Firebase Admin Auth instance'
    );

    // Second call
    const authInstance2 = firebaseAdminService.auth();
    expect(authInstance2).toBe(mockAuthInstance);
    expect(getAuth).toHaveBeenCalledTimes(1); // Should not call getAuth again

    // Trace log should only happen once during initialization
    expect(mockLogger.trace).toHaveBeenCalledTimes(1);
  });

  // --- Test verifyIdToken --- //
  describe('verifyIdToken', () => {
    const token = 'test-token-123';
    const mockDecodedToken = { uid: 'decoded-uid' };

    it('should call auth().verifyIdToken and log trace', async () => {
      mockAdminAuthInstance.verifyIdToken.mockResolvedValue(mockDecodedToken as any);

      const decoded = await firebaseAdminService.verifyIdToken(token);

      expect(decoded).toEqual(mockDecodedToken);
      expect(mockAdminAuthInstance.verifyIdToken).toHaveBeenCalledWith(token);
      expect(mockLogger.trace).toHaveBeenCalledWith(
        { token: token.substring(0, 10) + '...' },
        'Verifying ID token'
      );
    });

    it('should re-throw error if verifyIdToken fails', async () => {
      const error = new Error('Token verification failed');
      mockAdminAuthInstance.verifyIdToken.mockRejectedValue(error);

      await expect(firebaseAdminService.verifyIdToken(token)).rejects.toThrow(error);
      expect(mockLogger.trace).toHaveBeenCalledWith(
        { token: token.substring(0, 10) + '...' },
        'Verifying ID token' // Still logs attempt
      );
    });
  });

  // --- Test getUserByUid --- //
  describe('getUserByUid', () => {
    const uid = 'test-uid-456';
    const mockUserRecord = { uid: uid, email: 'test@example.com' };

    it('should call auth().getUser and log trace', async () => {
      mockAdminAuthInstance.getUser.mockResolvedValue(mockUserRecord as any);

      const user = await firebaseAdminService.getUserByUid(uid);

      expect(user).toEqual(mockUserRecord);
      expect(mockAdminAuthInstance.getUser).toHaveBeenCalledWith(uid);
      expect(mockLogger.trace).toHaveBeenCalledWith({ uid }, 'Getting user by UID');
    });

    it('should re-throw error if getUser fails', async () => {
      const error = new Error('User fetch failed');
      mockAdminAuthInstance.getUser.mockRejectedValue(error);

      await expect(firebaseAdminService.getUserByUid(uid)).rejects.toThrow(error);
      expect(mockLogger.trace).toHaveBeenCalledWith({ uid }, 'Getting user by UID');
    });
  });

  // --- Test getUserByEmail --- //
  describe('getUserByEmail', () => {
    const email = 'fire@base.com';
    const mockUserRecord = { uid: 'firebase-user-123', email: email };

    it('should call auth().getUserByEmail and log trace', async () => {
      mockAdminAuthInstance.getUserByEmail.mockResolvedValue(mockUserRecord as any);

      const user = await firebaseAdminService.getUserByEmail(email);

      expect(user).toEqual(mockUserRecord);
      expect(mockAdminAuthInstance.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockLogger.trace).toHaveBeenCalledWith({ email }, 'Getting user by email');
    });

    it('should re-throw error if getUserByEmail fails', async () => {
      const error = new Error('Email lookup failed');
      mockAdminAuthInstance.getUserByEmail.mockRejectedValue(error);

      await expect(firebaseAdminService.getUserByEmail(email)).rejects.toThrow(error);
      expect(mockLogger.trace).toHaveBeenCalledWith({ email }, 'Getting user by email');
    });
  });

  // --- Test updateUser --- //
  describe('updateUser', () => {
    const uid = 'firebase-user-456';
    const updateData = { displayName: 'Firebase User Updated' };
    const mockUpdatedUserRecord = { uid: uid, ...updateData };

    it('should call auth().updateUser and log debug', async () => {
      mockAdminAuthInstance.updateUser.mockResolvedValue(mockUpdatedUserRecord as any);

      const user = await firebaseAdminService.updateUser(uid, updateData);

      expect(user).toEqual(mockUpdatedUserRecord);
      expect(mockAdminAuthInstance.updateUser).toHaveBeenCalledWith(uid, updateData);
      expect(mockLogger.debug).toHaveBeenCalledWith({ uid, data: updateData }, 'Updating user');
    });

    it('should re-throw error if updateUser fails', async () => {
      const error = new Error('Firebase update failed');
      mockAdminAuthInstance.updateUser.mockRejectedValue(error);

      await expect(firebaseAdminService.updateUser(uid, updateData)).rejects.toThrow(error);
      expect(mockLogger.debug).toHaveBeenCalledWith({ uid, data: updateData }, 'Updating user');
    });
  });

  // --- Test createCustomToken --- //
  describe('createCustomToken', () => {
    const uid = 'user-for-token';
    const claims = { premium: true };
    const mockToken = 'mock-firebase-custom-token';

    it('should call auth().createCustomToken and log debug', async () => {
      mockAdminAuthInstance.createCustomToken.mockResolvedValue(mockToken);

      const token = await firebaseAdminService.createCustomToken(uid, claims);

      expect(token).toEqual(mockToken);
      expect(mockAdminAuthInstance.createCustomToken).toHaveBeenCalledWith(uid, claims);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { uid, hasClaims: true },
        'Creating custom token'
      );
    });

    it('should call createCustomToken without claims', async () => {
      mockAdminAuthInstance.createCustomToken.mockResolvedValue(mockToken);

      const token = await firebaseAdminService.createCustomToken(uid);

      expect(token).toEqual(mockToken);
      expect(mockAdminAuthInstance.createCustomToken).toHaveBeenCalledWith(uid, undefined);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { uid, hasClaims: false },
        'Creating custom token'
      );
    });

    it('should re-throw error if createCustomToken fails', async () => {
      const error = new Error('Token creation failed');
      mockAdminAuthInstance.createCustomToken.mockRejectedValue(error);

      await expect(firebaseAdminService.createCustomToken(uid, claims)).rejects.toThrow(error);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { uid, hasClaims: true },
        'Creating custom token' // Still logs attempt
      );
    });
  });
});
