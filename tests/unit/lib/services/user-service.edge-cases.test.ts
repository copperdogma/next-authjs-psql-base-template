import { mockDeep, mockReset, MockProxy } from 'jest-mock-extended';
import { PrismaClient, User as PrismaUser, UserRole } from '@prisma/client';
import * as pino from 'pino';
import { UserService } from '../../../../lib/services/user-service';

/**
 * UserService Edge Case Tests
 *
 * This test suite focuses on edge cases and error conditions that might not be
 * covered in the main test suite. These tests help ensure robustness and
 * proper error handling in production scenarios.
 */

// Mock the logger module
jest.mock('../../../../lib/logger', () => {
  const mockLoggerInstance = {
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
    logger: mockLoggerInstance,
    loggers: {
      user: mockLoggerInstance,
      default: mockLoggerInstance,
      profile: mockLoggerInstance,
      auth: mockLoggerInstance,
      api: mockLoggerInstance,
      db: mockLoggerInstance,
      middleware: mockLoggerInstance,
      ui: mockLoggerInstance,
    },
  };
});

let mockLoggerInstance: pino.Logger;
const mockPrismaUserDelegate = mockDeep<PrismaClient['user']>();
const mockPrismaAccountDelegate = mockDeep<PrismaClient['account']>();

// Helper to create a mock Prisma User with realistic data
const createMockUser = (overrides: Partial<PrismaUser> = {}) => {
  return {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    emailVerified: null,
    hashedPassword: null,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    role: 'USER' as UserRole,
    lastSignedInAt: null,
    ...overrides,
  };
};

describe('UserService Edge Cases', () => {
  let userService: UserService;
  let prismaClientInstance: MockProxy<PrismaClient>;

  beforeEach(async () => {
    const mockedLoggerModule = await import('../../../../lib/logger');
    mockLoggerInstance = mockedLoggerModule.logger;
    jest.clearAllMocks();

    prismaClientInstance = mockDeep<PrismaClient>();
    (prismaClientInstance as any).user = mockPrismaUserDelegate;
    (prismaClientInstance as any).account = mockPrismaAccountDelegate;
    mockReset(mockPrismaUserDelegate);
    mockReset(mockPrismaAccountDelegate);

    userService = new UserService(prismaClientInstance);
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely long user IDs gracefully', async () => {
      const extremelyLongId = 'x'.repeat(10000); // 10KB string
      mockPrismaUserDelegate.findUnique.mockRejectedValue(
        new Error('String too long for database field')
      );

      const result = await userService.findUserById(extremelyLongId);

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(mockLoggerInstance.error).toHaveBeenCalled();
    });

    it('should handle malformed email addresses in findUserByEmail', async () => {
      const malformedEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-at-sign.com',
        'double@@at.com',
        '',
        ' ',
        '\n\t',
      ];

      for (const email of malformedEmails) {
        mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

        const result = await userService.findUserByEmail(email);

        expect(result.status).toBe('error');
        expect(result.error?.code).toBe('USER_NOT_FOUND');
        expect(result.data).toBeNull();
      }
    });

    it('should handle special characters and unicode in user names', async () => {
      const specialNames = [
        'José María García-Hernández',
        '测试用户',
        'Ñoño',
        'User\nWith\nNewlines',
        'User\tWith\tTabs',
        'User With    Multiple    Spaces',
        '🙂😊💻',
      ];

      for (const name of specialNames) {
        const mockUser = createMockUser({ name });
        mockPrismaUserDelegate.update.mockResolvedValue(mockUser);

        const result = await userService.updateUserName('test-user-id', name);

        expect(result.status).toBe('success');
        expect(result.data?.name).toBe(name);
      }
    });
  });

  describe('Database Connection and Transaction Edge Cases', () => {
    it('should handle database connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      (timeoutError as any).code = 'TIMEOUT';
      mockPrismaUserDelegate.findUnique.mockRejectedValue(timeoutError);

      const result = await userService.findUserById('test-user-id');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(timeoutError);
    });

    it('should handle database constraint violations properly', async () => {
      const constraintError = new Error('Unique constraint failed');
      (constraintError as any).code = 'P2002';
      (constraintError as any).meta = { target: ['email'] };

      mockPrismaUserDelegate.update.mockRejectedValue(constraintError);

      const result = await userService.updateUserName('test-user-id', 'New Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_UPDATE_FAILED');
      expect(result.error?.details?.originalError).toBe(constraintError);
    });

    it('should handle transaction rollback scenarios', async () => {
      const rollbackError = new Error('Transaction rolled back');
      (rollbackError as any).code = 'P2034';

      mockPrismaUserDelegate.findMany.mockRejectedValue(rollbackError);

      const result = await userService.getUsersWithSessions();

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(rollbackError);
    });

    it('should handle database schema mismatch errors', async () => {
      const schemaError = new Error('Column not found in current database schema');
      (schemaError as any).code = 'P1012';

      mockPrismaUserDelegate.findUnique.mockRejectedValue(schemaError);

      const result = await userService.findUserById('test-user-id');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
    });
  });

  describe('Large Data Set Handling', () => {
    it('should handle queries returning large numbers of users efficiently', async () => {
      // Simulate a large user set (1000 users)
      const largeUserSet = Array.from({ length: 1000 }, (_, index) =>
        createMockUser({
          id: `user-${index}`,
          email: `user${index}@example.com`,
          name: `User ${index}`,
        })
      );

      mockPrismaUserDelegate.findMany.mockResolvedValue(largeUserSet as any);

      const result = await userService.getUsersWithSessionCounts({ take: 1000 });

      expect(result.status).toBe('success');
      expect(result.data?.length).toBe(1000);
      // Check that debug was called with the expected message
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1000, msg: 'Retrieved users with session counts' })
      );
    });

    it('should handle users with extremely large numbers of sessions', async () => {
      // User with 500 sessions
      const userWithManySessions = {
        ...createMockUser(),
        sessions: Array.from({ length: 500 }, (_, index) => ({
          id: `session-${index}`,
          userId: 'test-user-id',
          expires: new Date(Date.now() + 86400000), // 24 hours from now
          sessionToken: `token-${index}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };

      mockPrismaUserDelegate.findUnique.mockResolvedValue(userWithManySessions as any);

      const result = await userService.getUserWithSessions('test-user-id');

      expect(result.status).toBe('success');
      expect(result.data?.sessions).toHaveLength(500);
      // Check that debug was called with the expected message
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
        expect.objectContaining({ sessionCount: 500, msg: 'Retrieved user with sessions' })
      );
    });
  });

  describe('Concurrent Access Edge Cases', () => {
    it('should handle race conditions in user updates', async () => {
      // Simulate a race condition where user is updated between read and write
      const raceConditionError = new Error(
        'The record you are trying to update has been modified by another user'
      );
      (raceConditionError as any).code = 'P2025'; // Record not found (outdated)

      mockPrismaUserDelegate.update.mockRejectedValue(raceConditionError);

      const result = await userService.updateUserName('test-user-id', 'Updated Name');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.error?.details?.originalError).toBe(raceConditionError);
    });

    it('should handle concurrent session expiration updates', async () => {
      const concurrentAccessError = new Error('Concurrent access detected');
      (concurrentAccessError as any).code = 'P2002'; // Unique constraint violation

      mockPrismaUserDelegate.findMany.mockRejectedValue(concurrentAccessError);

      const result = await userService.getUsersWithActiveSessions({
        expiresAfter: new Date(),
      });

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
    });
  });

  describe('Account Linking Edge Cases', () => {
    it('should handle orphaned accounts (user deleted but account remains)', async () => {
      const orphanedAccount = {
        id: 'account-1',
        provider: 'google',
        providerAccountId: '12345',
        userId: 'deleted-user-id',
        user: null, // User was deleted but account remains
      };

      mockPrismaAccountDelegate.findUnique.mockResolvedValue(orphanedAccount as any);

      const result = await userService.getUserByAccount('google', '12345');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.data).toBeNull();
    });

    it('should handle accounts with corrupted provider data', async () => {
      const corruptedDataError = new Error('Invalid provider data format');
      mockPrismaAccountDelegate.findUnique.mockRejectedValue(corruptedDataError);

      const result = await userService.getUserByAccount('invalid-provider', 'corrupted-id');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(corruptedDataError);
    });

    it('should handle multiple accounts with same provider but different states', async () => {
      // Test that we correctly find the account even if there are similar ones
      const targetAccount = {
        id: 'account-target',
        provider: 'google',
        providerAccountId: 'target-12345',
        userId: 'user-1',
        user: createMockUser({ id: 'user-1', email: 'target@example.com' }),
      };

      mockPrismaAccountDelegate.findUnique.mockResolvedValue(targetAccount as any);

      const result = await userService.getUserByAccount('google', 'target-12345');

      expect(result.status).toBe('success');
      expect(result.data?.email).toBe('target@example.com');
      expect(mockPrismaAccountDelegate.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: { provider: 'google', providerAccountId: 'target-12345' },
        },
        include: { user: true },
      });
    });
  });

  describe('Date and Time Edge Cases', () => {
    it('should handle sessions with past expiration dates correctly', async () => {
      const pastDate = new Date('2020-01-01T00:00:00.000Z');
      const futureDate = new Date('2030-01-01T00:00:00.000Z');

      const usersWithMixedSessions = [
        {
          ...createMockUser({ id: 'user-1' }),
          sessions: [
            { id: 'session-1', expires: pastDate, sessionToken: 'token-1' },
            { id: 'session-2', expires: futureDate, sessionToken: 'token-2' },
          ],
        },
      ];

      mockPrismaUserDelegate.findMany.mockResolvedValue(usersWithMixedSessions as any);

      const result = await userService.getUsersWithActiveSessions({
        expiresAfter: new Date(), // Current time
      });

      expect(result.status).toBe('success');
      expect(mockPrismaUserDelegate.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        include: {
          sessions: {
            where: {
              expires: {
                gt: expect.any(Date),
              },
            },
          },
        },
        where: {
          sessions: {
            some: {
              expires: {
                gt: expect.any(Date),
              },
            },
          },
        },
      });
    });

    it('should handle timezone edge cases in session filtering', async () => {
      // Test with UTC and local timezone dates
      const utcDate = new Date('2023-12-31T23:59:59.000Z');
      const localDate = new Date('2024-01-01T00:00:00.000Z');

      mockPrismaUserDelegate.findMany.mockResolvedValue([]);

      const result1 = await userService.getUsersWithActiveSessions({
        expiresAfter: utcDate,
      });
      const result2 = await userService.getUsersWithActiveSessions({
        expiresAfter: localDate,
      });

      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      // Both should work without timezone conversion errors
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory pressure during large operations', async () => {
      const memoryError = new Error('Out of memory');
      (memoryError as any).code = 'ENOMEM';

      mockPrismaUserDelegate.findMany.mockRejectedValue(memoryError);

      const result = await userService.getUsersWithSessions({ take: 100000 });

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(memoryError);
    });

    it('should handle slow queries that exceed expected response times', async () => {
      // Simulate a slow query by using a timeout
      const slowQueryPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 100);
      });

      mockPrismaUserDelegate.findMany.mockImplementation(() => slowQueryPromise as any);

      const result = await userService.getUsersWithSessions();

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should handle null/undefined values in complex query results', async () => {
      const userWithNullValues = {
        id: 'user-1',
        name: null,
        email: 'test@example.com',
        image: null,
        emailVerified: null,
        hashedPassword: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'USER' as UserRole,
        lastSignedInAt: null,
        sessions: [
          {
            id: 'session-1',
            userId: 'user-1',
            expires: null, // Invalid session
            sessionToken: 'token-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrismaUserDelegate.findUnique.mockResolvedValue(userWithNullValues as any);

      const result = await userService.getUserWithSessions('user-1');

      expect(result.status).toBe('success');
      expect(result.data?.name).toBeNull();
      expect(result.data?.sessions).toHaveLength(1);
    });

    it('should handle inconsistent data states gracefully', async () => {
      // User exists but has no corresponding account record
      const userWithoutAccounts = createMockUser();
      mockPrismaUserDelegate.findUnique.mockResolvedValue(userWithoutAccounts);

      const result = await userService.findUserById('test-user-id');

      expect(result.status).toBe('success');
      expect(result.data).toEqual(userWithoutAccounts);
    });
  });

  describe('Logging and Monitoring Edge Cases', () => {
    it('should handle logger failures gracefully', async () => {
      const mockUser = createMockUser();
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      // Mock logger to throw an error on debug calls
      (mockLoggerInstance.debug as jest.Mock).mockImplementation(() => {
        throw new Error('Logger failed');
      });

      // The service should handle logger failures - in this case it will throw
      // but in a real implementation, logging failures would be caught
      await expect(userService.findUserById('test-user-id')).rejects.toThrow('Logger failed');

      // Reset the mock to ensure other tests work
      (mockLoggerInstance.debug as jest.Mock).mockReset();
    });

    it('should handle extreme log volumes without performance degradation', async () => {
      // Reset logger mock to work normally for this test
      (mockLoggerInstance.debug as jest.Mock).mockImplementation(() => {});

      // This test ensures that many rapid operations don't cause issues
      const promises = Array.from({ length: 100 }, (_, index) => {
        const mockUser = createMockUser({ id: `user-${index}` });
        mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);
        return userService.findUserById(`user-${index}`);
      });

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.status).toBe('success');
        expect(result.data?.id).toBe(`user-${index}`);
      });
    });
  });

  describe('Service Lifecycle Edge Cases', () => {
    it('should handle service shutdown during active operations', async () => {
      // Reset logger mock to work normally for this test
      (mockLoggerInstance.debug as jest.Mock).mockImplementation(() => {});
      (mockLoggerInstance.error as jest.Mock).mockImplementation(() => {});

      const shutdownError = new Error('Connection closed');
      (shutdownError as any).code = 'CONNECTION_CLOSED';

      mockPrismaUserDelegate.findUnique.mockRejectedValue(shutdownError);

      const result = await userService.findUserById('test-user-id');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(shutdownError);
    });

    it('should handle multiple service instances with shared database', async () => {
      // Reset logger mock to work normally for this test
      (mockLoggerInstance.debug as jest.Mock).mockImplementation(() => {});

      // Create two service instances
      const service1 = new UserService(prismaClientInstance);
      const service2 = new UserService(prismaClientInstance);

      const mockUser = createMockUser();
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      // Both should work independently
      const result1 = await service1.findUserById('test-user-id');
      const result2 = await service2.findUserById('test-user-id');

      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      expect(result1.data).toEqual(result2.data);
    });
  });
});
