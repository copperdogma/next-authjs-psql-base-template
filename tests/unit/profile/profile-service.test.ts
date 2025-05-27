/**
 * @jest-environment node
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProfileService } from '../../../lib/services/profile-service';
import { User as PrismaUser, PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  level: 'info',
  child: jest.fn().mockReturnThis(),
} as unknown as Logger;

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

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = mockDeep<PrismaClient>();
    profileService = new ProfileService(mockPrisma, mockLogger);
  });

  describe('Constructor', () => {
    it('should throw an error if PrismaClient is not provided', () => {
      const expectedErrorMessage = 'PrismaClient dependency is required for ProfileService.';
      try {
        new ProfileService(null as any, mockLogger);
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe(expectedErrorMessage);
      }
      expect.assertions(2);
    });

    it('should successfully instantiate if PrismaClient and logger are provided', () => {
      expect(() => new ProfileService(mockPrisma, mockLogger)).not.toThrow();
    });
  });

  describe('updateUserName', () => {
    const userId = 'test-user-123';
    const newName = 'New Sparkly Name';
    const mockUpdatedUser = createMockUser({ id: userId, name: newName });

    it('should successfully update username and return success response', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
      const result = await profileService.updateUserName(userId, newName);

      expect(result).toEqual({
        status: 'success',
        data: mockUpdatedUser,
        message: 'User name updated successfully.',
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: newName },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId, newName, function: 'updateUserName' },
        'User name updated successfully in DB.'
      );
    });

    it('should return failure response if DB update fails', async () => {
      const dbError = new Error('DB update failed');
      mockPrisma.user.update.mockRejectedValue(dbError);
      const result = await profileService.updateUserName(userId, newName);

      expect(result).toEqual({
        status: 'error',
        message: 'Failed to update user name in database.',
        error: {
          message: 'A database error occurred while updating the user name.',
          code: 'DB_UPDATE_FAILED',
          details: { originalError: dbError },
        },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        { userId, newName, function: 'updateUserName', error: dbError },
        'Failed to update user name in database.'
      );
    });

    it('should return validation error if newName is empty', async () => {
      const result = await profileService.updateUserName(userId, '');
      expect(result).toEqual({
        status: 'error',
        message: 'Name validation failed.',
        error: { message: 'New name cannot be empty.', code: 'VALIDATION_ERROR' },
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should return validation error if userId is empty', async () => {
      const result = await profileService.updateUserName('', newName);
      expect(result).toEqual({
        status: 'error',
        message: 'User ID validation failed.',
        error: { message: 'User ID cannot be empty.', code: 'VALIDATION_ERROR' },
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    const userId = 'test-user-123';
    const mockUser = createMockUser({ id: userId });

    it('should return user profile if user is found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await profileService.getUserProfile(userId);
      expect(result).toEqual({
        status: 'success',
        data: mockUser,
        message: 'User profile fetched successfully.',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return error if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await profileService.getUserProfile(userId);
      expect(result).toEqual({
        status: 'error',
        message: 'User profile not found.',
        error: { message: 'No user found with the provided ID.', code: 'USER_NOT_FOUND' },
      });
    });

    it('should return error if Prisma call fails', async () => {
      const dbError = new Error('Prisma findUnique failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);
      const result = await profileService.getUserProfile(userId);
      expect(result).toEqual({
        status: 'error',
        message: 'Failed to fetch user profile from database.',
        error: {
          message: 'A database error occurred while fetching the user profile.',
          code: 'DB_FETCH_FAILED',
          details: { originalError: dbError },
        },
      });
    });

    it('should return validation error if userId is empty', async () => {
      const result = await profileService.getUserProfile('');
      expect(result).toEqual({
        status: 'error',
        message: 'User ID validation failed.',
        error: { message: 'User ID cannot be empty.', code: 'VALIDATION_ERROR' },
      });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
