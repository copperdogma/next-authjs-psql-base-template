import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { pino } from 'pino';
import type { FirebaseAdminService } from '../../../lib/services/firebase-admin-service';
import { ProfileService } from '../../../lib/services/profile-service';
import type { UserService } from '../../../lib/services/user-service';
import type { auth } from 'firebase-admin'; // Import auth namespace
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import type { User as PrismaUser } from '@prisma/client'; // Import Prisma User type
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import { UserRole } from '@prisma/client'; // Import UserRole enum

// Define mock types for Firebase Admin Auth methods
type MockAuth = DeepMockProxy<auth.Auth> & {
  getUserByEmail: jest.Mock;
  updateUser: jest.Mock;
};

// Mocks
const mockLogger = mockDeep<pino.Logger>();
const mockUserService = mockDeep<UserService>();
const mockFirebaseAdminService = mockDeep<FirebaseAdminService>();
const mockFirebaseAuth = mockDeep<MockAuth>(); // Mock for auth() return value

// Helper to create a mock Prisma User
const createMockUser = (overrides: Partial<PrismaUser> = {}): PrismaUser => ({
  id: 'default-id',
  name: 'Default Name',
  email: 'default@example.com',
  emailVerified: new Date(),
  image: null,
  hashedPassword: null,
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockUserService);
    mockReset(mockFirebaseAdminService);
    mockReset(mockFirebaseAuth); // Reset the auth mock as well

    // Mock the auth() method to return our specific mockFirebaseAuth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockFirebaseAdminService.auth as jest.MockedFunction<any>).mockReturnValue(mockFirebaseAuth);

    // Correct constructor arguments
    profileService = new ProfileService(mockUserService, mockFirebaseAdminService, mockLogger);
  });

  it('should be defined', () => {
    expect(profileService).toBeDefined();
  });

  // Test the actual updateUserName method
  describe('updateUserName', () => {
    const userId = 'test-user-id';
    const name = 'Updated Name';
    const email = 'test@example.com';
    const firebaseUid = 'firebase-uid';

    it('should log start and success, update DB and Firebase', async () => {
      // Arrange: Setup mocks for successful path
      const initialUser = createMockUser({ id: userId, email: email, name: 'Old Name' });
      const updatedUser = createMockUser({ ...initialUser, name: name });

      mockUserService.updateUserName.mockResolvedValue(updatedUser);
      mockUserService.findUserById.mockResolvedValue(initialUser);
      mockFirebaseAuth.getUserByEmail.mockResolvedValue({ uid: firebaseUid } as auth.UserRecord);
      mockFirebaseAuth.updateUser.mockResolvedValue({
        uid: firebaseUid,
        displayName: name,
      } as auth.UserRecord);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify DB calls
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);

      // Verify Firebase calls
      expect(mockFirebaseAdminService.auth).toHaveBeenCalledTimes(2); // Called for getUserByEmail and updateUser
      expect(mockFirebaseAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockFirebaseAuth.updateUser).toHaveBeenCalledWith(firebaseUid, { displayName: name });

      // Verify logs
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Firebase user displayName updated', userId, firebaseUid }),
        expect.any(String) // Pino adds a message string as the second arg
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'User name updated successfully', userId }),
        expect.any(String)
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log Firebase update error but still succeed if DB update works', async () => {
      // Arrange: Setup mocks for DB success, Firebase failure
      const firebaseError = new Error('Firebase update failed');
      const initialUser = createMockUser({ id: userId, email: email, name: 'Old Name' });
      const updatedUser = createMockUser({ ...initialUser, name: name });

      mockUserService.updateUserName.mockResolvedValue(updatedUser);
      mockUserService.findUserById.mockResolvedValue(initialUser);
      mockFirebaseAuth.getUserByEmail.mockResolvedValue({ uid: firebaseUid } as auth.UserRecord);
      mockFirebaseAuth.updateUser.mockRejectedValue(firebaseError); // Simulate Firebase error

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert: Should still succeed because DB is source of truth
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify DB calls
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);

      // Verify Firebase calls attempted
      expect(mockFirebaseAdminService.auth).toHaveBeenCalledTimes(2);
      expect(mockFirebaseAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockFirebaseAuth.updateUser).toHaveBeenCalledWith(firebaseUid, { displayName: name });

      // Verify logs (Info for DB, Error for Firebase)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error updating Firebase user displayName',
          error: firebaseError.message,
          userId,
        }),
        expect.any(String)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'User name updated successfully', userId }),
        expect.any(String)
      );
    });

    it('should log DB update error and fail', async () => {
      // Arrange: Setup mocks for DB failure
      const dbError = new Error('Database update failed');
      mockUserService.updateUserName.mockRejectedValue(dbError); // Simulate DB error

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert: Should fail
      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred while updating your name');

      // Verify DB call attempted
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);

      // Verify Firebase calls NOT made
      expect(mockUserService.findUserById).not.toHaveBeenCalled();
      expect(mockFirebaseAdminService.auth).not.toHaveBeenCalled();

      // Verify logs (Error for DB)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error updating user name in database',
          error: dbError.message,
          userId,
        }),
        expect.any(String)
      );
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should handle user not having an email (skip Firebase update)', async () => {
      // Arrange: User found in DB but has no email
      const initialUser = createMockUser({ id: userId, email: null, name: 'Old Name' });
      const updatedUser = createMockUser({ ...initialUser, name: name });

      mockUserService.updateUserName.mockResolvedValue(updatedUser);
      mockUserService.findUserById.mockResolvedValue(initialUser); // No email

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify DB calls
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);

      // Verify Firebase calls NOT made
      expect(mockFirebaseAdminService.auth).not.toHaveBeenCalled();

      // Verify logs (Only success log for DB update)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'User name updated successfully', userId }),
        expect.any(String)
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});

// Note: We are assuming the second argument to logger calls is always a string.
// If Pino is configured differently, these assertions might need adjustment.
