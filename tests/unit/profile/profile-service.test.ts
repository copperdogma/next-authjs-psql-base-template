import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { ProfileService } from '@/lib/services/profile-service';
import { UserService, FirebaseAdminService, LoggerService } from '@/lib/interfaces/services';

// Mock dependencies
const mockUserService: jest.Mocked<UserService> = {
  updateUserName: jest.fn(),
  findUserById: jest.fn(),
  findUserByEmail: jest.fn(),
};

const mockLoggerService: jest.Mocked<LoggerService> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFirebaseAdminService: jest.Mocked<FirebaseAdminService> = {
  auth: jest.fn(() => ({
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
  })),
};

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(() => {
    jest.resetAllMocks();
    profileService = new ProfileService(
      mockUserService,
      mockFirebaseAdminService,
      mockLoggerService
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('updateUserName', () => {
    it('should update user name in database and Firebase', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';

      mockUserService.updateUserName.mockResolvedValue({
        id: userId,
        name,
        email: 'test@example.com',
      } as any);

      mockUserService.findUserById.mockResolvedValue({
        id: userId,
        name,
        email: 'test@example.com',
      } as any);

      const authMock = {
        getUserByEmail: jest.fn().mockResolvedValue({ uid: 'firebase-123' }),
        updateUser: jest.fn().mockResolvedValue({}),
      };
      mockFirebaseAdminService.auth.mockReturnValue(authMock);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(authMock.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(authMock.updateUser).toHaveBeenCalledWith('firebase-123', { displayName: name });
      expect(mockLoggerService.info).toHaveBeenCalledTimes(2);
    });

    it('should still succeed if Firebase update fails', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';

      mockUserService.updateUserName.mockResolvedValue({
        id: userId,
        name,
        email: 'test@example.com',
      } as any);

      mockUserService.findUserById.mockResolvedValue({
        id: userId,
        name,
        email: 'test@example.com',
      } as any);

      const authMock = {
        getUserByEmail: jest.fn().mockResolvedValue({ uid: 'firebase-123' }),
        updateUser: jest.fn().mockRejectedValue(new Error('Firebase error')),
      };
      mockFirebaseAdminService.auth.mockReturnValue(authMock);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(authMock.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(authMock.updateUser).toHaveBeenCalledWith('firebase-123', { displayName: name });
      expect(mockLoggerService.error).toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'User name updated successfully',
          userId,
        })
      );
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';

      mockUserService.updateUserName.mockResolvedValue({
        id: userId,
        name,
      } as any); // No email

      mockUserService.findUserById.mockResolvedValue({
        id: userId,
        name,
      } as any); // No email

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.auth).not.toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'User name updated successfully',
          userId,
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';

      mockUserService.updateUserName.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred while updating your name');
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
