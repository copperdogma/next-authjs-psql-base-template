import { describe, expect, it, beforeEach } from '@jest/globals';
import { UserService } from '../../../lib/services/user-service';
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import { PrismaClient, UserRole } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
// Mock the logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock the Prisma client
const mockPrismaClient = mockDeep<PrismaClient>();
const mockPrismaUserDelegate = mockDeep<PrismaClient['user']>();

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Link the delegate to the client
    // @ts-ignore
    mockPrismaClient.user = mockPrismaUserDelegate;
    userService = new UserService(mockPrismaClient, mockLogger as any);
  });

  describe('findUserById', () => {
    it('should find a user by ID and return it', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
        emailVerified: null,
        image: null,
        hashedPassword: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should return null when no user is found', async () => {
      const userId = 'non-existent-id';
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      const result = await userService.findUserById(userId);

      expect(result).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should log error and rethrow when DB lookup fails', async () => {
      const userId = 'test-user-id';
      const testError = new Error('Database error');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(testError);

      await expect(userService.findUserById(userId)).rejects.toThrow(testError);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user by email and return it', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email,
        role: UserRole.USER,
        emailVerified: null,
        image: null,
        hashedPassword: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should return null when no user is found by email', async () => {
      const email = 'nonexistent@example.com';
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      const result = await userService.findUserByEmail(email);

      expect(result).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should log error and rethrow when email lookup fails', async () => {
      const email = 'test@example.com';
      const testError = new Error('Database error');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(testError);

      await expect(userService.findUserByEmail(email)).rejects.toThrow(testError);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateUserName', () => {
    it('should update a user name and return the updated user', async () => {
      const userId = 'test-user-id';
      const newName = 'New Test Name';
      const mockUpdatedUser = {
        id: userId,
        name: newName,
        email: 'test@example.com',
        role: UserRole.USER,
        emailVerified: null,
        image: null,
        hashedPassword: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUserDelegate.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUserName(userId, newName);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: newName },
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log error and rethrow when update fails', async () => {
      const userId = 'test-user-id';
      const newName = 'New Test Name';
      const testError = new Error('Database error');
      mockPrismaUserDelegate.update.mockRejectedValue(testError);

      await expect(userService.updateUserName(userId, newName)).rejects.toThrow(testError);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: newName },
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
