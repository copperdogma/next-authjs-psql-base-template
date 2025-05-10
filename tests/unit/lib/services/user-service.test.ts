import { mockDeep, mockReset, MockProxy } from 'jest-mock-extended';
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

// Mock the logger module that user-service imports
jest.mock('../../../../lib/logger', () => {
  // Define the mock logger structure directly within the factory to avoid hoisting issues
  const internalMockLoggerInstance = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    silent: jest.fn(),
    level: 'info',
    child: jest.fn().mockReturnThis(),
  } as unknown as pino.Logger;

  return {
    logger: internalMockLoggerInstance,
    loggers: {
      // If UserService or its dependencies use specific named loggers
      user: internalMockLoggerInstance, // Assuming user-service might use loggers.user
      default: internalMockLoggerInstance, // Covering general cases
      profile: internalMockLoggerInstance, // For consistency with other mocks
      auth: internalMockLoggerInstance,
      api: internalMockLoggerInstance,
      db: internalMockLoggerInstance,
      middleware: internalMockLoggerInstance,
      ui: internalMockLoggerInstance,
    },
    // Ensure other exports from the logger module are mocked if needed, e.g.:
    // createApiLogger: jest.fn(() => internalMockLoggerInstance),
  };
});

// We need a way to access the mock instance for assertions.
// One way is to re-import the mocked logger after jest.mock has run.
// This is a bit of a workaround for Jest's behavior with module factories.
let mockLoggerInstance: pino.Logger;

const mockPrismaUserDelegate = mockDeep<PrismaClient['user']>();
// const mockPrismaClient = mockDeep<PrismaClient>(); // We create a fresh one per test

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
  lastSignedInAt: null,
  ...overrides,
});

describe('UserService', () => {
  let userService: UserService;
  let prismaClientInstance: MockProxy<PrismaClient>; // Use MockProxy type

  beforeEach(async () => {
    // Dynamically import the mocked logger to get the instance created by the factory
    const mockedLoggerModule = await import('../../../../lib/logger');
    mockLoggerInstance = mockedLoggerModule.logger; // Or loggers.user, depending on what UserService uses

    // Reset calls for the shared mockLoggerInstance before each test
    jest.clearAllMocks(); // This will clear calls on jest.fn() instances within mockLoggerInstance

    prismaClientInstance = mockDeep<PrismaClient>(); // Create fresh mock for each test
    (prismaClientInstance as any).user = mockPrismaUserDelegate;
    mockReset(mockPrismaUserDelegate); // Reset this delegate before each test

    // UserService constructor has a default for logger, which will now pick up the mocked logger
    // from the jest.mock factory above.
    userService = new UserService(prismaClientInstance);
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
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'User found by ID',
        userId,
        found: true,
      });
      expect(mockLoggerInstance.error).not.toHaveBeenCalled();
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
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'User found by ID',
        userId,
        found: false,
      });
      expect(mockLoggerInstance.error).not.toHaveBeenCalled();
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
      expect(mockLoggerInstance.error).toHaveBeenCalledWith({
        msg: 'Error finding user by ID',
        userId,
        error: dbError.message,
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({ msg: 'Finding user by ID', userId });
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
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'Finding user by email',
        email,
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'User found by email',
        email,
        found: true,
      });
      expect(mockLoggerInstance.error).not.toHaveBeenCalled();
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
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'Finding user by email',
        email,
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'User found by email',
        email,
        found: false,
      });
      expect(mockLoggerInstance.error).not.toHaveBeenCalled();
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
      expect(mockLoggerInstance.error).toHaveBeenCalledWith({
        msg: 'Error finding user by email',
        email,
        error: dbError.message,
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith({
        msg: 'Finding user by email',
        email,
      });
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
      expect(mockLoggerInstance.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
      expect(mockLoggerInstance.info).toHaveBeenCalledWith({
        msg: 'User name updated successfully',
        userId,
      });
      expect(mockLoggerInstance.error).not.toHaveBeenCalled();
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
      expect(mockLoggerInstance.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId: nonExistentId,
        error: nonExistentError.message,
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledWith({
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
      expect(mockLoggerInstance.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId,
        error: dbError.message,
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
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
      expect(mockLoggerInstance.error).toHaveBeenCalledWith({
        msg: 'Error updating user name',
        userId,
        error: 'String error message',
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledWith({ msg: 'Updating user name', userId });
    });
  });
});
