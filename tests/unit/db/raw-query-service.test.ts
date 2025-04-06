import { RawQueryService } from '../../../lib/db/raw-query-service';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

// Mock the prisma client and Prisma.raw
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));

// Mock Prisma.raw function
jest.mock('@prisma/client', () => {
  return {
    Prisma: {
      raw: jest.fn(str => str),
    },
  };
});

describe('RawQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSessionCountsByDay', () => {
    it('executes the query with no parameters', async () => {
      // Mock the query result
      const mockResults = [
        { date: '2023-01-01T00:00:00.000Z', count: '5' },
        { date: '2023-01-02T00:00:00.000Z', count: '10' },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const result = await RawQueryService.getUserSessionCountsByDay({});

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([
        { date: '2023-01-01T00:00:00.000Z', count: 5 },
        { date: '2023-01-02T00:00:00.000Z', count: 10 },
      ]);
    });

    it('executes the query with all parameters', async () => {
      // Mock the query result
      const mockResults = [{ date: '2023-01-01T00:00:00.000Z', count: '3' }];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const userId = 'user-123';

      const result = await RawQueryService.getUserSessionCountsByDay({
        startDate,
        endDate,
        userId,
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([{ date: '2023-01-01T00:00:00.000Z', count: 3 }]);
    });
  });

  describe('extendSessionExpirations', () => {
    it('returns 0 when userIds is empty', async () => {
      const result = await RawQueryService.extendSessionExpirations({
        userIds: [],
        extensionHours: 24,
      });

      expect(result).toBe(0);
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('executes query with userIds and extension hours', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(2);

      const result = await RawQueryService.extendSessionExpirations({
        userIds: ['user-1', 'user-2'],
        extensionHours: 24,
      });

      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(result).toBe(2);
    });

    it('includes expiryBefore when provided', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValue(1);

      const expiryDate = new Date('2023-01-31');
      const result = await RawQueryService.extendSessionExpirations({
        userIds: ['user-1'],
        extensionHours: 24,
        currentExpiryBefore: expiryDate,
      });

      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(result).toBe(1);
    });
  });

  describe('getUserActivitySummary', () => {
    it('executes query with default options', async () => {
      const mockResults = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          userName: 'User One',
          sessionCount: '5',
          lastActive: '2023-01-01T00:00:00.000Z',
        },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const result = await RawQueryService.getUserActivitySummary({});

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          userName: 'User One',
          sessionCount: 5,
          lastActive: '2023-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('includes since parameter when provided', async () => {
      const mockResults = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          userName: 'User One',
          sessionCount: '3',
          lastActive: '2023-01-01T00:00:00.000Z',
        },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const since = new Date('2022-12-31');
      const result = await RawQueryService.getUserActivitySummary({
        since,
        minSessionCount: 2,
        limit: 10,
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          userName: 'User One',
          sessionCount: 3,
          lastActive: '2023-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('executeRawQuery', () => {
    it('executes a raw query with parameters', async () => {
      const mockResults = [{ count: 5 }];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const sql = 'SELECT COUNT(*) as count FROM "User" WHERE "email" = $1';
      const params = ['user@example.com'];

      const result = await RawQueryService.executeRawQuery(sql, params);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });
  });
});
