import { mockDeep, mockReset } from 'jest-mock-extended';
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import { PrismaClient, User as PrismaUser, UserRole } from '@prisma/client';
import * as pino from 'pino';
import { UserService } from '../../../../lib/services/user-service';

/**
 * UserService Unit Tests
 *
 * COVERAGE EXCLUSIONS:
 *
 * 1. Default Export (defaultUserService):
 *    The defaultUserService export is not explicitly tested due to challenges with
 *    testing default exports in TypeScript/Jest environments. Default exports often
 *    require special handling in Jest mocks (using __esModule: true flag) and can
 *    lead to testing complexity with circular dependencies. Instead, we focus on
 *    testing the class implementation directly.
 *
 *    Related issues:
 *    - Default exports can be undefined in Jest tests (documented in various Jest/TS forums)
 *    - TypeScript requires specific configuration with esModuleInterop and allowSyntheticDefaultImports
 *    - Special handling needed for ES modules in Jest
 *
 * 2. Database Constraint Violations:
 *    Tests for database constraint violations (like unique constraint errors) are omitted
 *    because they're better suited for integration tests with actual database instances.
 *    Mocking specific database error states for every possible constraint is cumbersome
 *    and less valuable than testing against real database behaviors.
 *
 * 3. Complex Transaction Testing:
 *    Operations involving complex transactions are tested at an integration level
 *    rather than with unit tests, as mocking transaction behavior accurately requires
 *    significant effort and may not correctly represent actual database behavior.
 */

// Mocks
const mockLogger = mockDeep<pino.Logger>();
const mockPrismaUserDelegate = mockDeep<PrismaClient['user']>();
const mockPrismaClient = mockDeep<PrismaClient>();

// Helper to create a mock Prisma User
const createMockUser = (overrides: Partial<PrismaUser>): PrismaUser => ({
  id: 'default-id',
  name: 'Default Name',
  email: 'default@example.com',
  emailVerified: null,
  image: null,
  hashedPassword: null,
  role: UserRole.USER, // Explicitly set default role
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockPrismaClient);
    mockReset(mockPrismaUserDelegate);

    // Link the mocked delegate to the mocked client instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockPrismaClient.user as any) = mockPrismaUserDelegate;

    userService = new UserService(mockPrismaClient, mockLogger);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findUserById', () => {
    const userId = 'user-123';

    it('should call prisma.user.findUnique and log debug on success', async () => {
      // Arrange
      const mockUser = createMockUser({ id: userId });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      // Act
      const user = await userService.findUserById(userId);

      // Assert
      expect(user).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        msg: 'User found by ID',
        userId,
        found: true,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null and log when user is not found', async () => {
      // Arrange
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      // Act
      const user = await userService.findUserById(userId);

      // Assert
      expect(user).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        msg: 'User found by ID',
        userId,
        found: false,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error if prisma call fails', async () => {
      // Arrange
      const dbError = new Error('DB lookup failed');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findUserById(userId)).rejects.toThrow(dbError);

      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: 'Error finding user by ID',
        userId,
        error: dbError.message,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
    });
  });

  describe('findUserByEmail', () => {
    const email = 'test@example.com';

    it('should call prisma.user.findUnique and log debug on success', async () => {
      // Arrange
      const mockUser = createMockUser({ email });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      // Act
      const user = await userService.findUserByEmail(email);

      // Assert
      expect(user).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by email', email });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        msg: 'User found by email',
        email,
        found: true,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null and log when user is not found by email', async () => {
      // Arrange
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      // Act
      const user = await userService.findUserByEmail(email);

      // Assert
      expect(user).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by email', email });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        msg: 'User found by email',
        email,
        found: false,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error if prisma call fails', async () => {
      // Arrange
      const dbError = new Error('DB email lookup failed');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findUserByEmail(email)).rejects.toThrow(dbError);

      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: 'Error finding user by email',
        email,
        error: dbError.message,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Finding user by email', email });
    });
  });

  describe('updateUserName', () => {
    const userId = 'user-456';
    const name = 'Updated Name';

    it('should call prisma.user.update and log info on success', async () => {
      // Arrange
      const updatedUser = createMockUser({ id: userId, name });
      mockPrismaUserDelegate.update.mockResolvedValue(updatedUser);

      // Act
      const user = await userService.updateUserName(userId, name);

      // Assert
      expect(user).toEqual(updatedUser);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLogger.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: 'User name updated successfully',
        userId,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle error when updating a non-existent user', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const nonExistentError = new Error('Record to update not found.');
      mockPrismaUserDelegate.update.mockRejectedValue(nonExistentError);

      // Act & Assert
      await expect(userService.updateUserName(nonExistentId, name)).rejects.toThrow(
        nonExistentError
      );

      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: nonExistentId },
        data: { name },
      });
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId: nonExistentId,
        error: nonExistentError.message,
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: 'Updating user name',
        userId: nonExistentId,
      });
    });

    it('should log error if update fails due to database error', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      mockPrismaUserDelegate.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.updateUserName(userId, name)).rejects.toThrow(dbError);

      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId,
        error: dbError.message,
      });
      expect(mockLogger.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
    });

    it('should handle non-Error objects in error handling', async () => {
      // Arrange
      const nonErrorObject = 'String error message';
      mockPrismaUserDelegate.update.mockRejectedValue(nonErrorObject);

      // Act & Assert
      await expect(userService.updateUserName(userId, name)).rejects.toEqual(nonErrorObject);

      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId,
        error: 'String error message',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
    });
  });
});
