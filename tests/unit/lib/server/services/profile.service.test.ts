import { jest } from '@jest/globals';
import { PrismaClient, User as PrismaUser, UserRole } from '@prisma/client';
import { ProfileServiceImpl } from '@/lib/server/services/profile.service';
import { logger } from '@/lib/logger';
import { prismaMock } from '../../../../mocks/db/prismaMocks';
import { User } from '@prisma/client';

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

describe('ProfileService', () => {
  let profileService: ProfileServiceImpl;

  beforeEach(() => {
    profileService = new ProfileServiceImpl(prismaMock);
  });

  describe('updateUserName', () => {
    it('should update a user name and return a success response', async () => {
      const mockUser: any = {
        id: 'user-1',
        name: 'Updated Name',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await profileService.updateUserName('user-1', 'Updated Name');

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUser);
      expect(result.message).toBe('User name updated successfully.');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should return validation error for names shorter than 3 characters', async () => {
      const result = await profileService.updateUserName('user-1', 'Ab');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.message).toContain('Name must be between 3 and 50 characters');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should return validation error for names longer than 50 characters', async () => {
      const longName = 'A'.repeat(51);
      const result = await profileService.updateUserName('user-1', longName);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.message).toContain('Name must be between 3 and 50 characters');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should return user not found error when user does not exist', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prismaMock.user.update.mockRejectedValue(error);

      const result = await profileService.updateUserName('non-existent-user', 'New Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.message).toBe('User not found.');
      expect(result.error?.details?.originalError).toBe(error);
    });

    it('should return general error for other database errors', async () => {
      const error = new Error('Database connection error');
      prismaMock.user.update.mockRejectedValue(error);

      // Set E2E test flag to false to test error path
      const originalEnv = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV;
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'false';

      const result = await profileService.updateUserName('user-1', 'New Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_UPDATE_FAILED');
      expect(result.error?.message).toBe('Database connection error');
      expect(result.error?.details?.originalError).toBe(error);

      // Restore environment
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = originalEnv;
    });

    it('should return mock success response in E2E test environment', async () => {
      const error = new Error('Database connection error');
      prismaMock.user.update.mockRejectedValue(error);

      // Set E2E test flag to true to test mock path
      const originalEnv = process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV;
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = 'true';

      const result = await profileService.updateUserName('user-1', 'New Name');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect((result.data as User).name).toBe('New Name');
      expect(result.message).toContain('E2E test mock');

      // Restore environment
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV = originalEnv;
    });
  });
});
