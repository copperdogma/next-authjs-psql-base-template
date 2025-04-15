import {
  getUsersWithSessions,
  getUserWithSessions,
  getUsersWithActiveSessions,
  getUsersWithSessionCounts,
} from '../../../lib/db/user-service';
import { prisma } from '../../../lib/prisma';

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

// Mock the prisma client
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('UserService (static methods)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsersWithSessions', () => {
    it('retrieves users with their sessions', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          sessions: [{ id: 'session-1', userId: 'user-1' }],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getUsersWithSessions();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: { sessions: true },
      });
      expect(result).toEqual(mockUsers);
    });

    it('applies provided options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          sessions: [{ id: 'session-1' }],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const options = {
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' as const },
        where: { email: { contains: 'example.com' } },
      };

      const result = await getUsersWithSessions(options);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        ...options,
        include: { sessions: true },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserWithSessions', () => {
    it('retrieves a single user with their sessions', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        sessions: [{ id: 'session-1', userId: 'user-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const userId = 'user-1';
      const result = await getUserWithSessions(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { sessions: true },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUsersWithActiveSessions', () => {
    it('retrieves users with active sessions using default options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          sessions: [{ id: 'session-1', expires: new Date('2099-01-01') }],
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getUsersWithActiveSessions();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
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
      expect(result).toEqual(mockUsers);
    });

    it('applies pagination options', async () => {
      const mockUsers = [{ id: 'user-1', sessions: [] }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const expiresAfter = new Date('2023-01-01');
      const result = await getUsersWithActiveSessions({
        skip: 5,
        take: 10,
        expiresAfter,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      );
      expect(result).toEqual(mockUsers);
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
          _count: { sessions: 5 },
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getUsersWithSessionCounts();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
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
      expect(result).toEqual(mockUsers);
    });

    it('applies pagination options', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          _count: { sessions: 3 },
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getUsersWithSessionCounts({
        skip: 0,
        take: 5,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
        })
      );
      expect(result).toEqual(mockUsers);
    });
  });
});
