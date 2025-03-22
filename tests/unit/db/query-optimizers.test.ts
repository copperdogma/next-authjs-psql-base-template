import { QueryOptimizer } from '../../../lib/db/query-optimizer';
import { prisma } from '../../../lib/prisma';
import { RawQueryService } from '../../../lib/db/raw-query-service';

// Mock the prisma client
jest.mock('../../../lib/prisma', () => {
  return {
    prisma: {
      $queryRaw: jest.fn(() => Promise.resolve([])),
      $executeRaw: jest.fn(() => Promise.resolve(5))
    }
  };
});

describe('Query Optimizers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('QueryOptimizer', () => {
    test('selectOnly creates optimized select object', () => {
      type UserFields = { id: string, name: string, email: string };
      const fields: Array<keyof UserFields> = ['id', 'name', 'email'];
      const result = QueryOptimizer.selectOnly<UserFields>(fields);
      
      expect(result).toEqual({
        id: true,
        name: true,
        email: true
      });
    });
    
    test('cursorPagination creates efficient pagination config', () => {
      // Test with default options
      const defaultConfig = QueryOptimizer.cursorPagination();
      expect(defaultConfig).toHaveProperty('take', 20);
      expect(defaultConfig).toHaveProperty('skip', 0);
      expect(defaultConfig.orderBy).toEqual({ createdAt: 'desc' });
      
      // Test with cursor
      const cursorConfig = QueryOptimizer.cursorPagination({
        cursor: '123',
        cursorField: 'id',
        take: 10
      });
      
      expect(cursorConfig).toHaveProperty('take', 10);
      expect(cursorConfig).toHaveProperty('skip', 1); // Skip 1 with cursor
      expect(cursorConfig.cursor).toEqual({ id: '123' });
    });
    
    test('multiFieldSearch creates OR-based search condition', () => {
      type UserProfile = { name: string, email: string, bio: string };
      const fields: Array<keyof UserProfile> = ['name', 'email', 'bio'];
      const result = QueryOptimizer.multiFieldSearch<UserProfile>(
        'john', fields
      );
      
      expect(result).toHaveProperty('OR');
      expect(result.OR).toHaveLength(3);
      expect(result.OR[0]).toEqual({
        name: { contains: 'john', mode: 'insensitive' }
      });
      
      // Empty search term returns empty object
      const emptyResult = QueryOptimizer.multiFieldSearch<{ name: string }>(
        '', ['name' as keyof { name: string }]
      );
      expect(emptyResult).toEqual({});
    });
    
    test('selectWithCounts creates select with _count aggregation', () => {
      type User = { id: string, name: string };
      type UserRelations = { posts: unknown[], comments: unknown[] };
      
      const fields: Array<keyof User> = ['id', 'name'];
      const countFields: Array<keyof UserRelations> = ['posts', 'comments'];
      
      const result = QueryOptimizer.selectWithCounts<User, UserRelations>(
        fields, countFields
      );
      
      expect(result).toEqual({
        id: true,
        name: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      });
    });
    
    test('dateFilter creates proper date range conditions', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Test with before and after
      const rangeFilter = QueryOptimizer.dateFilter<{ createdAt: Date }>(
        'createdAt', { before: now, after: yesterday }
      );
      
      expect(rangeFilter.createdAt).toHaveProperty('lt');
      expect(rangeFilter.createdAt).toHaveProperty('gt');
      expect(rangeFilter.createdAt.lt).toEqual(now);
      expect(rangeFilter.createdAt.gt).toEqual(yesterday);
      
      // Test with exact day
      const dayFilter = QueryOptimizer.dateFilter<{ createdAt: Date }>(
        'createdAt', { exactDay: now }
      );
      
      expect(dayFilter.createdAt).toHaveProperty('gte');
      expect(dayFilter.createdAt).toHaveProperty('lte');
      
      // Start of day should have time set to 00:00:00
      const startDate = dayFilter.createdAt.gte;
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      
      // End of day should have time set to 23:59:59
      const endDate = dayFilter.createdAt.lte;
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });
  });
  
  describe('RawQueryService', () => {
    test('getUserSessionCountsByDay calls $queryRaw with correct parameters', async () => {
      const mockResults = [
        { date: new Date(), count: '5' },
        { date: new Date(), count: '10' }
      ];
      
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce(mockResults);
      
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      await RawQueryService.getUserSessionCountsByDay({
        startDate,
        endDate,
        userId: 'user123'
      });
      
      // Verify queryRaw was called
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
    
    test('extendSessionExpirations calls $executeRaw with correct parameters', async () => {
      (prisma.$executeRaw as jest.Mock).mockResolvedValueOnce(5);
      
      const result = await RawQueryService.extendSessionExpirations({
        userIds: ['user1', 'user2'],
        extensionHours: 24,
        currentExpiryBefore: new Date()
      });
      
      // Verify executeRaw was called
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(result).toBe(5);
      
      // Empty userIds should return 0 without calling executeRaw
      const emptyResult = await RawQueryService.extendSessionExpirations({
        userIds: [],
        extensionHours: 24
      });
      
      expect(emptyResult).toBe(0);
      // Should not have been called again
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
    
    test('executeRawQuery provides a safe wrapper for raw queries', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ count: 10 }]);
      
      const result = await RawQueryService.executeRawQuery<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM "User" WHERE "email" LIKE $1',
        ['%.com']
      );
      
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([{ count: 10 }]);
    });
  });
}); 