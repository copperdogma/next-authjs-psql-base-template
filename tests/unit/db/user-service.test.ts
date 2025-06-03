import {
  // Remove direct import of real prisma
  // import { prisma } from '../../../lib/prisma';

  // Import the singleton mock
  prismaMock,
  resetPrismaMock,
} from '../../mocks/db/prismaMocks';

// Import the consolidated service instance
import { defaultUserService } from '../../../lib/services/user-service';

/**
 * DB User Service Unit Tests
 *
 * COVERAGE EXCLUSIONS:
 *
 * 1. UserService Class Instance Methods:
 *    This test file only covers the static wrapper functions (exported helper functions)
 *    but not the internal UserService class instance methods directly. This is because:
 *    - The static functions provide a stable public API that user code interacts with
 *    - Testing both would create redundant coverage as they call the same underlying code
 *    - The instance methods require additional setup with class instantiation
 *
 * 2. N+1 Query Prevention Testing:
 *    As noted in lib/db/user-service.ts, testing Prisma's N+1 query prevention mechanisms
 *    is challenging in a unit test environment. The file contains this explanatory comment:
 *
 *    "Unit testing database interactions, especially involving Prisma in Jest,
 *    can face significant environment and mocking challenges (e.g., PrismaClient
 *    initialization errors). Tests specifically targeting patterns like N+1 query
 *    prevention for methods in this service were skipped due to these issues."
 *
 *    These optimizations are better verified through integration tests or query monitoring
 *    during E2E tests where actual database queries can be observed.
 *
 * 3. Custom PrismaClient Constructor Testing:
 *    Testing with custom PrismaClient instances is omitted as this introduces
 *    complexity with initialization in the test environment and provides limited value
 *    in unit tests where we mock the client anyway.
 *
 * 4. Transaction Handling:
 *    Complex transaction scenarios and rollbacks aren't tested at the unit level
 *    because accurate simulation requires extensive mocking of Prisma's transaction
 *    API. These are better tested in integration tests with actual database operations.
 */

// Remove file-specific mock - handled globally
// jest.mock('../../../lib/prisma', () => ({
//   prisma: {
//     user: {
//       findMany: jest.fn(),
//       findUnique: jest.fn(),
//     },
//   },
// }));

describe('UserService (consolidated implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton mock
    resetPrismaMock();
  });

  describe('getUsersWithSessions', () => {
    it('retrieves users with their sessions', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          // Ensure mock data matches Prisma types if possible
          sessions: [
            { id: 'session-1', userId: 'user-1', expires: new Date(), sessionToken: 'token' },
          ],
        },
      ];

      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any); // Use `as any` if types are complex/incomplete

      const result = await defaultUserService.getUsersWithSessions();

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        include: { sessions: true },
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });

    it('applies provided options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          sessions: [
            { id: 'session-1', userId: 'user-1', expires: new Date(), sessionToken: 'token' },
          ],
        },
      ];

      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const options = {
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' as const },
        where: { email: { contains: 'example.com' } },
      };

      const result = await defaultUserService.getUsersWithSessions(options);

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        ...options,
        include: { sessions: true },
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });

    it('handles errors appropriately', async () => {
      const testError = new Error('Database connection error');
      prismaMock.user.findMany.mockRejectedValue(testError);

      const result = await defaultUserService.getUsersWithSessions();

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('DB_FETCH_FAILED');
      expect(result.error?.details?.originalError).toBe(testError);
    });
  });

  describe('getUserWithSessions', () => {
    it('retrieves a single user with their sessions', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        sessions: [
          { id: 'session-1', userId: 'user-1', expires: new Date(), sessionToken: 'token' },
        ],
      };

      // Use prismaMock
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const userId = 'user-1';
      const result = await defaultUserService.getUserWithSessions(userId);

      // Use prismaMock
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { sessions: true },
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUser);
    });

    it('returns an error when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await defaultUserService.getUserWithSessions('non-existent-id');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.data).toBeNull();
    });
  });

  describe('getUsersWithActiveSessions', () => {
    it('retrieves users with active sessions using default options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          sessions: [
            {
              id: 'session-1',
              expires: new Date('2099-01-01'),
              sessionToken: 'token',
              userId: 'user-1',
            },
          ],
        },
      ];

      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await defaultUserService.getUsersWithActiveSessions();

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            sessions: expect.objectContaining({
              where: expect.objectContaining({
                expires: expect.objectContaining({
                  gt: expect.any(Date),
                }),
              }),
            }),
          }),
          where: expect.objectContaining({
            sessions: expect.objectContaining({
              some: expect.objectContaining({
                expires: expect.objectContaining({
                  gt: expect.any(Date),
                }),
              }),
            }),
          }),
        })
      );
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });

    it('applies pagination options', async () => {
      const mockUsers = [{ id: 'user-1', sessions: [] }];
      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const options = {
        skip: 5,
        take: 10,
        expiresAfter: new Date('2023-01-01'),
      };

      const result = await defaultUserService.getUsersWithActiveSessions(options);

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: options.skip,
          take: options.take,
        })
      );
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('getUsersWithSessionCounts', () => {
    it('retrieves users with session counts', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            sessions: 5,
          },
        },
      ];

      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await defaultUserService.getUsersWithSessionCounts();

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });

    it('applies pagination options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            sessions: 3,
          },
        },
      ];

      // Use prismaMock
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const options = {
        skip: 10,
        take: 5,
      };

      const result = await defaultUserService.getUsersWithSessionCounts(options);

      // Use prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        skip: options.skip,
        take: options.take,
        select: expect.any(Object),
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('getUserByAccount', () => {
    it('finds a user by provider and providerAccountId', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
      };

      const mockAccount = {
        id: 'account-1',
        provider: 'google',
        providerAccountId: '12345',
        userId: 'user-1',
        user: mockUser,
      };

      prismaMock.account.findUnique.mockResolvedValue(mockAccount as any);

      const result = await defaultUserService.getUserByAccount('google', '12345');

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: { provider: 'google', providerAccountId: '12345' },
        },
        include: { user: true },
      });
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockUser);
    });

    it('returns an error when account is not found', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      const result = await defaultUserService.getUserByAccount('google', 'non-existent');

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('USER_NOT_FOUND');
      expect(result.data).toBeNull();
    });
  });
});
