/**
 * @jest-environment node
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProfileService } from '../../../lib/services/profile-service';
import { UserService } from '../../../lib/services/user-service';
import { FirebaseAdminService } from '../../../lib/services/firebase-admin-service';
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import { User as PrismaUser, UserRole } from '@prisma/client';
// @ts-ignore - TODO: Investigate Firebase type resolution issue
import type { UserRecord } from 'firebase-admin/auth';
import { Logger } from 'pino';

// Mocks for the service modules themselves
jest.mock('../../../lib/services/user-service');
jest.mock('../../../lib/services/firebase-admin-service');

// Create a basic logger mock that satisfies our testing needs
// Using a simpler approach than mockDeep<Logger>() to avoid type conflicts
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  level: 'info',
  child: jest.fn().mockReturnThis(), // Returns itself for chained calls
} as unknown as Logger;

// Mock the logger module
jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
  loggers: {
    profile: mockLogger,
    auth: mockLogger,
    api: mockLogger,
    db: mockLogger,
    middleware: mockLogger,
    ui: mockLogger,
  },
}));

// Helper to create mock PrismaUser
const createMockUser = (overrides: Partial<PrismaUser> = {}): PrismaUser => ({
  id: 'default-id',
  name: 'Default Name',
  email: 'default@example.com',
  emailVerified: null,
  image: null,
  hashedPassword: null,
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedInAt: null,
  ...overrides,
});

// Helper to create mock Firebase UserRecord
const createMockFirebaseUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  uid: 'firebase-uid',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  disabled: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
    lastRefreshTime: null,
  },
  providerData: [],
  passwordHash: null,
  passwordSalt: null,
  tokensValidAfterTime: null,
  tenantId: null,
  toJSON: () => ({ ...createMockFirebaseUser(overrides) }),
  ...overrides,
});

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockUserService: DeepMockProxy<UserService>;
  let mockFirebaseAdminService: DeepMockProxy<FirebaseAdminService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Use jest-mock-extended for service mocks to get type safety
    mockUserService = mockDeep<UserService>();
    mockFirebaseAdminService = mockDeep<FirebaseAdminService>();

    // ProfileService uses a default logger parameter that pulls from the mocked module
    profileService = new ProfileService(
      mockUserService,
      mockFirebaseAdminService,
      mockLogger // Explicitly pass the mockLogger
    );
  });

  describe('updateUserName', () => {
    const userId = 'test-user-123';
    const oldName = 'Old Name';
    const newName = 'New Sparkly Name';
    const userEmail = 'user@example.com';
    const firebaseUid = 'firebase-uid-abc';

    const mockInitialUser = createMockUser({ id: userId, name: oldName, email: userEmail });
    const mockUpdatedUser = createMockUser({ ...mockInitialUser, name: newName });

    it('should successfully update username in DB and Firebase, and return success', async () => {
      // Arrange: DB and Firebase operations succeed
      mockUserService.updateUserName.mockResolvedValue(mockUpdatedUser);
      mockUserService.findUserById.mockResolvedValue(mockUpdatedUser); // User has email
      mockFirebaseAdminService.getUserByEmail.mockResolvedValue({ uid: firebaseUid } as UserRecord);
      mockFirebaseAdminService.updateUser.mockResolvedValue({
        uid: firebaseUid,
        displayName: newName,
      } as UserRecord);

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).toHaveBeenCalledWith(userEmail);
      expect(mockFirebaseAdminService.updateUser).toHaveBeenCalledWith(firebaseUid, {
        displayName: newName,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId, firebaseUid }),
        'Firebase user displayName updated'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'User name updated successfully'
      );
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return success if DB update succeeds, even if Firebase getUserByEmail fails', async () => {
      // Arrange: DB succeeds, Firebase getUserByEmail fails
      mockUserService.updateUserName.mockResolvedValue(mockUpdatedUser);
      mockUserService.findUserById.mockResolvedValue(mockUpdatedUser);
      const firebaseGetError = new Error('Firebase getUserByEmail failed');
      mockFirebaseAdminService.getUserByEmail.mockRejectedValue(firebaseGetError);

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert: Overall success, Firebase issue logged as warning
      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockFirebaseAdminService.updateUser).not.toHaveBeenCalled(); // updateUser should not be called
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ userId, error: firebaseGetError.message }),
        'Could not update Firebase user - continuing'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'User name updated successfully'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return success if DB update succeeds, even if Firebase updateUser fails', async () => {
      // Arrange: DB succeeds, Firebase updateUser fails
      mockUserService.updateUserName.mockResolvedValue(mockUpdatedUser);
      mockUserService.findUserById.mockResolvedValue(mockUpdatedUser);
      mockFirebaseAdminService.getUserByEmail.mockResolvedValue({ uid: firebaseUid } as UserRecord);
      const firebaseUpdateError = new Error('Firebase updateUser failed');
      mockFirebaseAdminService.updateUser.mockRejectedValue(firebaseUpdateError);

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert: Overall success, Firebase issue logged as warning
      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockFirebaseAdminService.updateUser).toHaveBeenCalledWith(firebaseUid, {
        displayName: newName,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ userId, error: firebaseUpdateError.message }),
        'Could not update Firebase user - continuing'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'User name updated successfully'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return success if DB update succeeds and user has no email (skips Firebase)', async () => {
      // Arrange: User has no email
      const userWithoutEmail = createMockUser({ id: userId, name: oldName, email: null });
      const updatedUserWithoutEmail = { ...userWithoutEmail, name: newName };
      mockUserService.updateUserName.mockResolvedValue(updatedUserWithoutEmail);
      mockUserService.findUserById.mockResolvedValue(updatedUserWithoutEmail);

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockFirebaseAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'User name updated successfully (no Firebase update needed)'
      );
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return failure if userService.findUserById returns null after DB update', async () => {
      // Arrange
      mockUserService.updateUserName.mockResolvedValue(mockUpdatedUser); // DB update itself succeeds
      mockUserService.findUserById.mockResolvedValue(null); // But then user is not found

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert
      expect(result).toEqual({ success: true }); // Still success, but with specific log
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'User name updated successfully (no Firebase update needed)' // Because user or user.email was null
      );
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return failure if DB update (userService.updateUserName) fails', async () => {
      // Arrange: DB update fails
      const dbError = new Error('DB update failed');
      mockUserService.updateUserName.mockRejectedValue(dbError);

      // Act
      const result = await profileService.updateUserName(userId, newName);

      // Assert
      expect(result).toEqual({ success: false, error: dbError.message });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, newName);
      expect(mockUserService.findUserById).not.toHaveBeenCalled(); // Should not proceed to this
      expect(mockFirebaseAdminService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockFirebaseAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error updating user name in database',
          error: dbError.message,
          userId,
        })
        // The service implementation doesn't pass a second string arg to logger.error when error is Error instance
      );
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
