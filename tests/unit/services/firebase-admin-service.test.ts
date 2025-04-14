// Mock firebase-admin before importing FirebaseAdminService
import * as admin from 'firebase-admin';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Mock the entire firebase-admin module
jest.mock('firebase-admin', () => ({
  // Use mockDeep to create mocks for sub-modules like auth()
  auth: mockDeep<() => admin.auth.Auth>(),
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
}));

import type { pino } from 'pino';
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

describe('FirebaseAdminService', () => {
  let firebaseAdminService: FirebaseAdminService;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockInitializeApp);
    mockReset(mockAuth);
    mockReset(mockAdminAuthInstance);

    mockAuth.mockReturnValue(mockAdminAuthInstance);

    firebaseAdminService = new FirebaseAdminService(mockLogger);
  });

  it('should be defined', () => {
    expect(firebaseAdminService).toBeDefined();
  });

  it('should provide access to the auth instance', () => {
    const authInstance = firebaseAdminService.auth();
    expect(authInstance).toBe(mockAdminAuthInstance);
    expect(mockAuth).toHaveBeenCalled(); // Verify admin.auth() was called
  });

  // --- Test getUserByEmail ---
  describe('getUserByEmail', () => {
    const email = 'fire@base.com';
    const mockUserRecord = { uid: 'firebase-user-123', email: email } as admin.auth.UserRecord;

    it('should call auth().getUserByEmail and log trace on success', async () => {
      mockAdminAuthInstance.getUserByEmail.mockResolvedValue(mockUserRecord);

      const user = await firebaseAdminService.getUserByEmail(email);

      expect(user).toEqual(mockUserRecord);
      expect(mockAdminAuthInstance.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockLogger.trace).toHaveBeenCalledWith(
        expect.objectContaining({ email }),
        'Getting user by email'
      );
      // Removed checks for getUserById logs
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should re-throw error if auth().getUserByEmail fails (no specific error logging in service)', async () => {
      const authError = new Error('Firebase email lookup failed');
      mockAdminAuthInstance.getUserByEmail.mockRejectedValue(authError);

      await expect(firebaseAdminService.getUserByEmail(email)).rejects.toThrow(authError);

      expect(mockAdminAuthInstance.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockLogger.error).not.toHaveBeenCalled(); // Service doesn't catch/log this specific error
      expect(mockLogger.trace).toHaveBeenCalledWith(
        expect.objectContaining({ email }),
        'Getting user by email' // Still logs the attempt
      );
    });
  });

  // --- Test updateUser ---
  describe('updateUser', () => {
    const userId = 'firebase-user-456';
    const updateData = { displayName: 'Firebase User Updated' };
    const mockUpdatedUserRecord = { uid: userId, ...updateData } as admin.auth.UserRecord;

    it('should call auth().updateUser and log debug on success', async () => {
      mockAdminAuthInstance.updateUser.mockResolvedValue(mockUpdatedUserRecord);

      const user = await firebaseAdminService.updateUser(userId, updateData);

      expect(user).toEqual(mockUpdatedUserRecord);
      expect(mockAdminAuthInstance.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        // Changed from info to debug
        expect.objectContaining({ uid: userId, data: updateData }),
        'Updating user'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should re-throw error if auth().updateUser fails (no specific error logging in service)', async () => {
      const authError = new Error('Firebase update failed');
      mockAdminAuthInstance.updateUser.mockRejectedValue(authError);

      await expect(firebaseAdminService.updateUser(userId, updateData)).rejects.toThrow(authError);

      expect(mockAdminAuthInstance.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(mockLogger.error).not.toHaveBeenCalled(); // Service doesn't catch/log this specific error
      expect(mockLogger.debug).toHaveBeenCalledWith(
        // Changed from info to debug
        expect.objectContaining({ uid: userId, data: updateData }),
        'Updating user' // Still logs the attempt
      );
    });
  });

  // --- Test createCustomToken ---
  describe('createCustomToken', () => {
    const userId = 'user-for-token';
    const claims = { premium: true };
    const mockToken = 'mock-firebase-custom-token';

    it('should call auth().createCustomToken and log debug on success', async () => {
      mockAdminAuthInstance.createCustomToken.mockResolvedValue(mockToken);

      const token = await firebaseAdminService.createCustomToken(userId, claims);

      expect(token).toEqual(mockToken);
      expect(mockAdminAuthInstance.createCustomToken).toHaveBeenCalledWith(userId, claims);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ uid: userId }),
        'Creating custom token'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should re-throw error if auth().createCustomToken fails (no specific error logging)', async () => {
      const tokenError = new Error('Token creation failed');
      mockAdminAuthInstance.createCustomToken.mockRejectedValue(tokenError);

      await expect(firebaseAdminService.createCustomToken(userId, claims)).rejects.toThrow(
        tokenError
      );

      expect(mockAdminAuthInstance.createCustomToken).toHaveBeenCalledWith(userId, claims);
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ uid: userId }),
        'Creating custom token' // Still logs the attempt
      );
    });
  });

  // Add more tests if other methods are added to the service
});
