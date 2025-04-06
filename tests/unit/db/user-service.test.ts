import { UserService } from '../../../lib/db/user-service';
import { prisma } from '../../../lib/prisma';

// Mock the prisma client
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('UserService', () => {
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

      const result = await UserService.getUsersWithSessions();

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

      const result = await UserService.getUsersWithSessions(options);

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
      const result = await UserService.getUserWithSessions(userId);

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

      const result = await UserService.getUsersWithActiveSessions();

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
      const result = await UserService.getUsersWithActiveSessions({
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

      const result = await UserService.getUsersWithSessionCounts();

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

      const result = await UserService.getUsersWithSessionCounts({
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
