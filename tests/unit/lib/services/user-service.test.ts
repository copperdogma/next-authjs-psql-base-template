import { mockDeep, mockReset, MockProxy } from 'jest-mock-extended';
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
const createMockUser = (overrides: Partial<PrismaUser> = {}) => {
  return {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    emailVerified: null,
    hashedPassword: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'USER' as UserRole,
    lastSignedInAt: null,
    ...overrides,
  };
};

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
    const userId = 'test-user-id';

    it('should return a success response with user when found', async () => {
      // Arrange
      const mockUserData = createMockUser({ id: userId });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUserData);

      // Act
      const result = await userService.findUserById(userId);

      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUserData);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(2);
    });

    it('should return an error response when user is not found', async () => {
      // Arrange
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findUserById(userId);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.data).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(2);
    });

    it('should return an error response on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      // Act
      const result = await userService.findUserById(userId);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(dbError);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(1);
      expect(mockLoggerInstance.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('findUserByEmail', () => {
    const email = 'test@example.com';

    it('should return a success response with user when found', async () => {
      // Arrange
      const mockUserData = createMockUser({ email });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUserData);

      // Act
      const result = await userService.findUserByEmail(email);

      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUserData);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(2);
    });

    it('should return an error response when user is not found', async () => {
      // Arrange
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findUserByEmail(email);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.data).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(2);
    });

    it('should return an error response on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      // Act
      const result = await userService.findUserByEmail(email);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(dbError);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(1);
      expect(mockLoggerInstance.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserName', () => {
    const userId = 'test-user-id';
    const name = 'Updated Name';
    const nonExistentId = 'non-existent-id';

    it('should return a success response with updated user', async () => {
      // Arrange
      const mockUserData = createMockUser({ id: userId });
      const updatedMockUser = { ...mockUserData, name };
      mockPrismaUserDelegate.update.mockResolvedValue(updatedMockUser);

      // Act
      const result = await userService.updateUserName(userId, name);

      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual(updatedMockUser);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(2);
    });

    it('should return an error response when user is not found', async () => {
      // Arrange
      const prismaError = new Error('Record to update not found');
      Object.defineProperty(prismaError, 'code', { value: 'P2025' });
      mockPrismaUserDelegate.update.mockRejectedValue(prismaError);

      // Act
      const result = await userService.updateUserName(nonExistentId, name);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.details?.originalError).toBe(prismaError);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: nonExistentId },
        data: { name },
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(1);
      expect(mockLoggerInstance.error).toHaveBeenCalledTimes(1);
    });

    it('should return an error response on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      mockPrismaUserDelegate.update.mockRejectedValue(dbError);

      // Act
      const result = await userService.updateUserName(userId, name);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_UPDATE_FAILED');
      expect(result.error?.details?.originalError).toBe(dbError);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(1);
      expect(mockLoggerInstance.error).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error objects thrown by Prisma', async () => {
      // Arrange
      const nonErrorObject = { message: 'Something went wrong' };
      mockPrismaUserDelegate.update.mockRejectedValue(nonErrorObject);

      // Act
      const result = await userService.updateUserName(userId, name);

      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_UPDATE_FAILED');
      expect(result.error?.details?.originalError).toBe(nonErrorObject);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(1);
      expect(mockLoggerInstance.error).toHaveBeenCalledTimes(1);
    });
  });
});
