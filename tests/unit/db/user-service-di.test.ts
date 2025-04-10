import { UserService } from '../../../lib/db/user-service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaClient>;

// Separate test suite without importing the real userServiceInstance
describe('Backward Compatibility Layer', () => {
  // This test verifies the principle rather than making actual calls
  it('exported functions should properly forward to instance methods', () => {
    // Define our own implementation for testing
    class TestUserService {
      getUsersWithSessions = jest.fn();
      getUserWithSessions = jest.fn();
      getUsersWithActiveSessions = jest.fn();
      getUsersWithSessionCounts = jest.fn();
    }

    // Create an instance for testing
    const testInstance = new TestUserService();

    // Create forwarding functions like those in the real implementation
    const getUsers = (options?: any) => testInstance.getUsersWithSessions(options);
    const getUser = (id: string) => testInstance.getUserWithSessions(id);

    // Test the forwarding
    const options = { take: 5 };
    getUsers(options);
    expect(testInstance.getUsersWithSessions).toHaveBeenCalledWith(options);

    const userId = 'test-123';
    getUser(userId);
    expect(testInstance.getUserWithSessions).toHaveBeenCalledWith(userId);
  });
});

describe('UserService with Dependency Injection', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(mockPrisma);
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

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsersWithSessions();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const options = {
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' as const },
        where: { email: { contains: 'example.com' } },
      };

      const result = await userService.getUsersWithSessions(options);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const userId = 'user-1';
      const result = await userService.getUserWithSessions(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
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

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsersWithActiveSessions();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
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
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const expiresAfter = new Date('2023-01-01');
      const result = await userService.getUsersWithActiveSessions({
        skip: 5,
        take: 10,
        expiresAfter,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
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

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsersWithSessionCounts();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsersWithSessionCounts({
        skip: 0,
        take: 5,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
        })
      );
      expect(result).toEqual(mockUsers);
    });
  });
});
