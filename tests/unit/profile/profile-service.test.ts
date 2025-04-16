import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { ProfileService } from '../../../lib/services/profile-service';
import type { UserService } from '../../../lib/services/user-service';
import type { FirebaseAdminService, LoggerService } from '../../../lib/interfaces/services';

// Mock dependencies
const mockUserService: jest.Mocked<UserService> = {
  updateUserName: jest.fn(),
  findUserById: jest.fn(),
  findUserByEmail: jest.fn(),
} as jest.Mocked<UserService>;

const mockLoggerService: jest.Mocked<LoggerService> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as jest.Mocked<LoggerService>;

const mockFirebaseAdminService: jest.Mocked<FirebaseAdminService> = {
  verifyIdToken: jest.fn(),
  getUserByUid: jest.fn(),
  updateUser: jest.fn(),
  createCustomToken: jest.fn(),
} as jest.Mocked<FirebaseAdminService>;

describe.skip('ProfileService', () => {
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
    it('should update user name in database and attempt Firebase update via getUserByEmail', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';
      const mockUser = { id: userId, name, email: 'test@example.com' };
      const mockFirebaseUser = { uid: 'firebase-123', email: 'test@example.com' };

      mockUserService.updateUserName.mockResolvedValue(mockUser as any);
      mockUserService.findUserById.mockResolvedValue(mockUser as any);

      const mockAuthMethods = {
        getUserByEmail: jest.fn().mockResolvedValue(mockFirebaseUser),
        updateUser: jest.fn().mockResolvedValue({}),
      };
      (mockFirebaseAdminService as any).auth = jest.fn().mockReturnValue(mockAuthMethods);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockAuthMethods.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockAuthMethods.updateUser).toHaveBeenCalledWith('firebase-123', {
        displayName: name,
      });
      expect(mockLoggerService.info).toHaveBeenCalledTimes(2);
    });

    it('should still succeed if Firebase update fails', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';
      const mockUser = { id: userId, name, email: 'test@example.com' };
      const mockFirebaseUser = { uid: 'firebase-123' };

      mockUserService.updateUserName.mockResolvedValue(mockUser as any);
      mockUserService.findUserById.mockResolvedValue(mockUser as any);

      const mockAuthMethods = {
        getUserByEmail: jest.fn().mockResolvedValue(mockFirebaseUser),
        updateUser: jest.fn().mockRejectedValue(new Error('Firebase error')),
      };
      (mockFirebaseAdminService as any).auth = jest.fn().mockReturnValue(mockAuthMethods);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockAuthMethods.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockAuthMethods.updateUser).toHaveBeenCalledWith('firebase-123', {
        displayName: name,
      });
      expect(mockLoggerService.error).toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'User name updated successfully', userId })
      );
    });

    it('should handle user without email (skip Firebase update)', async () => {
      // Arrange
      const userId = 'user-123';
      const name = 'New Name';
      const mockUserNoEmail = { id: userId, name };

      mockUserService.updateUserName.mockResolvedValue(mockUserNoEmail as any);
      mockUserService.findUserById.mockResolvedValue(mockUserNoEmail as any);

      const mockAuthMethods = { getUserByEmail: jest.fn(), updateUser: jest.fn() };
      (mockFirebaseAdminService as any).auth = jest.fn().mockReturnValue(mockAuthMethods);

      // Act
      const result = await profileService.updateUserName(userId, name);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockAuthMethods.getUserByEmail).not.toHaveBeenCalled();
      expect(mockAuthMethods.updateUser).not.toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'User name updated successfully', userId })
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
