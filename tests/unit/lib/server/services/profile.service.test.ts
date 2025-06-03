import { jest } from '@jest/globals';
import { PrismaClient, User as PrismaUser, UserRole } from '@prisma/client';
import { ProfileServiceImpl } from '@/lib/server/services/profile.service';
import { logger } from '@/lib/logger';

// Mock the logger to prevent actual logging during tests and allow assertions
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

// Mock PrismaClient
const mockPrisma = {
  user: {
    update: jest.fn<(...args: any[]) => Promise<PrismaUser>>(),
    findUnique: jest.fn<(...args: any[]) => Promise<PrismaUser | null>>(),
  },
  // No longer needed: $executeRaw: jest.fn<(...args: any[]) => Promise<number>>(),
};

describe('ProfileServiceImpl', () => {
  let profileService: ProfileServiceImpl;
  let mockDbClient: PrismaClient;

  const testUserId = 'test-user-id';
  const validName = 'Valid Name';
  const invalidNameTooShort = 'V';
  const invalidNameTooLong = 'V'.repeat(51);

  const mockUser: PrismaUser = {
    id: testUserId,
    name: 'Old Name',
    email: 'test@example.com',
    emailVerified: new Date(),
    image: null,
    hashedPassword: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedInAt: new Date(),
    role: UserRole.USER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a new mock instance for PrismaClient for each test
    mockDbClient = mockPrisma as unknown as PrismaClient;
    profileService = new ProfileServiceImpl(mockDbClient);
  });

  describe('updateUserName', () => {
    it('should successfully update user name and return the user', async () => {
      const updatedUser = { ...mockUser, name: validName };
      // Prisma update succeeds
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await profileService.updateUserName(testUserId, validName);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(updatedUser);
      expect(result.error).toBeUndefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { name: validName },
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ dbUserId: updatedUser.id }),
        'Successfully updated user name in database.'
      );
    });

    it('should return error if name is too short', async () => {
      const result = await profileService.updateUserName(testUserId, invalidNameTooShort);
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toBe('Name must be between 3 and 50 characters.');
      expect(logger.warn).toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should return error if name is too long', async () => {
      const result = await profileService.updateUserName(testUserId, invalidNameTooLong);
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toBe('Name must be between 3 and 50 characters.');
      expect(logger.warn).toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should return error if Prisma update fails', async () => {
      const dbError = new Error('DB update failed');
      mockPrisma.user.update.mockRejectedValueOnce(dbError);

      // Set the environment variable to false to ensure we get the error response
      const originalEnv = process.env;
      process.env = { ...originalEnv, NEXT_PUBLIC_IS_E2E_TEST_ENV: 'false' };

      const result = await profileService.updateUserName(testUserId, validName);

      // Restore the environment
      process.env = originalEnv;

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toBe('DB update failed'); // Actual error message from the mock
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return "User not found." if Prisma update fails with P2025 (record not found)', async () => {
      const prismaNotFoundError = new Error('Record to update not found.') as any;
      prismaNotFoundError.code = 'P2025';

      mockPrisma.user.update.mockRejectedValueOnce(prismaNotFoundError);

      const result = await profileService.updateUserName(testUserId, validName);

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.error).toBe('User not found.');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: prismaNotFoundError.message,
          errorCode: 'P2025',
        }),
        'Error updating user name in database.'
      );
    });

    describe('E2E Test Environment Handling', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules(); // to re-evaluate process.env
        process.env = { ...originalEnv, NEXT_PUBLIC_IS_E2E_TEST_ENV: 'true' };
        // Re-initialize service with new env context if needed, but ProfileServiceImpl reads env directly
      });

      afterEach(() => {
        process.env = originalEnv;
      });

      it('should return mock success response if DB update fails in E2E test environment', async () => {
        mockPrisma.user.update.mockRejectedValueOnce(new Error('Prisma update failed'));

        const result = await profileService.updateUserName(testUserId, validName);

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.id).toBe(testUserId);
        expect(result.user?.name).toBe(validName);
        expect(result.error).toBeUndefined();
        expect(logger.warn).toHaveBeenCalledWith(
          expect.anything(), // The context object can be complex
          'E2E test environment detected, returning mock success response despite database error'
        );
      });
    });
  });
});
