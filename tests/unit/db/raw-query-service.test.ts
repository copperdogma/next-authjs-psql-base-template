import { RawQueryService } from '../../../lib/db/raw-query-service';
import { prisma } from '../../../lib/prisma';
// import { Prisma } from '@prisma/client'; // Unused import
import { RawQueryServiceImpl } from '../../../lib/services/raw-query-service';

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
    it('skips execution when userIds is empty', async () => {
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

// Add new describe block for testing the class-based implementation with DI
describe('RawQueryServiceImpl (DI version)', () => {
  // Create mock PrismaClient and LoggerService
  const mockPrismaClient = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use injected PrismaClient and LoggerService', async () => {
    const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

    expect(service).toBeInstanceOf(RawQueryServiceImpl);
  });

  describe('getUserSessionCountsByDay', () => {
    it('executes the query with injected dependencies', async () => {
      // Mock query results
      const mockResults = [
        { date: '2023-01-01T00:00:00.000Z', count: '5' },
        { date: '2023-01-02T00:00:00.000Z', count: '10' },
      ];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method
      const result = await service.getUserSessionCountsByDay({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      });

      // Verify logger was called
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Getting user session counts by day',
        })
      );

      // Verify prisma client was called
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();

      // Verify expected results
      expect(result).toEqual([
        { date: '2023-01-01T00:00:00.000Z', count: 5 },
        { date: '2023-01-02T00:00:00.000Z', count: 10 },
      ]);
    });

    // Test to cover error handling branch
    it('handles errors properly when query execution fails', async () => {
      // Mock a query error
      const queryError = new Error('Database connection failed');
      mockPrismaClient.$queryRaw.mockRejectedValue(queryError);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method and expect it to throw
      await expect(service.getUserSessionCountsByDay({})).rejects.toThrow(
        'Database connection failed'
      );

      // Verify logger error was called with the right parameters
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error during getting user session counts',
          error: 'Database connection failed',
        })
      );
    });

    // Test to cover non-Error object in error handling (lines 54-59)
    it('handles non-Error objects in error handler', async () => {
      // Mock a query error that's not an Error instance
      const nonErrorObject = 'String error message';
      mockPrismaClient.$queryRaw.mockRejectedValue(nonErrorObject);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method and expect it to throw
      await expect(service.getUserSessionCountsByDay({})).rejects.toBe(nonErrorObject);

      // Verify logger error was called with 'Unknown error'
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error during getting user session counts',
          error: 'Unknown error',
        })
      );
    });
  });

  describe('extendSessionExpirations', () => {
    it('uses injected PrismaClient for executeRaw operations', async () => {
      // Mock successful execution
      mockPrismaClient.$executeRaw.mockResolvedValue(2);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method
      const result = await service.extendSessionExpirations({
        userIds: ['user-1', 'user-2'],
        extensionHours: 24,
      });

      // Verify logger was called
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Extending session expirations',
        })
      );

      // Verify prisma client was called
      expect(mockPrismaClient.$executeRaw).toHaveBeenCalled();

      // Verify expected results
      expect(result).toBe(2);
    });

    // Test to cover error branch
    it('handles errors properly in extendSessionExpirations', async () => {
      // Mock an execution error
      mockPrismaClient.$executeRaw.mockRejectedValue(new Error('Failed to update sessions'));

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method with valid parameters
      await expect(
        service.extendSessionExpirations({
          userIds: ['user-1', 'user-2'],
          extensionHours: 24,
        })
      ).rejects.toThrow('Failed to update sessions');

      // Verify error logging
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error during extending session expirations',
          error: 'Failed to update sessions',
        })
      );
    });

    // Test to cover buildSessionExpirationWhereClause with null expiryBefore
    it('builds where clause without expiryBefore when not provided', async () => {
      // Mock execute result
      mockPrismaClient.$executeRaw.mockResolvedValue(3);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method without currentExpiryBefore
      await service.extendSessionExpirations({
        userIds: ['user-1', 'user-2', 'user-3'],
        extensionHours: 24,
      });

      // Just verify that the query ran and the userIds are included in the call
      expect(mockPrismaClient.$executeRaw).toHaveBeenCalled();

      // Extract stringifiable parts of the SQL to verify
      const callArgs = mockPrismaClient.$executeRaw.mock.calls[0]
        .map((arg: any) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');

      // Verify userIds are included but expiresAt condition is not
      expect(callArgs).toContain('user-1');
      expect(callArgs).not.toContain('expiresAt" <=');
    });

    // Test to cover buildSessionExpirationWhereClause with expiryBefore
    it('builds where clause with expiryBefore when provided', async () => {
      // Mock execute result
      mockPrismaClient.$executeRaw.mockResolvedValue(1);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method with currentExpiryBefore
      const expiryDate = new Date('2023-01-31');
      await service.extendSessionExpirations({
        userIds: ['user-1'],
        extensionHours: 24,
        currentExpiryBefore: expiryDate,
      });

      // Just verify that the query ran with the expected parameters
      expect(mockPrismaClient.$executeRaw).toHaveBeenCalled();

      // Extract stringifiable parts of the SQL to verify
      const callArgs = mockPrismaClient.$executeRaw.mock.calls[0]
        .map((arg: any) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');

      // Verify both userIds and expiresAt are included
      expect(callArgs).toContain('user-1');
      expect(callArgs).toContain('expiresAt');
    });
  });

  describe('getUserActivitySummary', () => {
    it('executes activity summary query with default parameters', async () => {
      // Mock query results
      const mockResults = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          userName: 'User One',
          sessionCount: '5',
          lastActive: '2023-01-01T00:00:00.000Z',
        },
      ];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method with default parameters
      const result = await service.getUserActivitySummary({});

      // Verify logger was called
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Getting user activity summary',
        })
      );

      // Verify prisma client was called
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();

      // Verify expected results
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

    // Test to cover buildActivityWhereClause with null since (line 218)
    it('builds empty where clause when since is not provided', async () => {
      // Mock query results
      const mockResults: any[] = [];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method without since parameter
      await service.getUserActivitySummary({});

      // Verify that the query was executed
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();

      // Extract all arguments passed to the mock for this call
      const callArgs = JSON.stringify(mockPrismaClient.$queryRaw.mock.calls[0]);

      // Verify the query doesn't include a WHERE clause for createdAt
      expect(callArgs).not.toContain('WHERE s."createdAt"');
    });

    // Test to cover buildActivityWhereClause with since (line 218)
    it('builds where clause with since when provided', async () => {
      // Mock query results
      const mockResults: any[] = [];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method with since parameter
      const sinceDate = new Date('2023-01-01');
      await service.getUserActivitySummary({ since: sinceDate });

      // Verify the query was executed
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();

      // Extract all arguments passed to the mock for this call
      const callArgs = JSON.stringify(mockPrismaClient.$queryRaw.mock.calls[0]);

      // Verify the query includes the since date
      expect(callArgs).toContain('createdAt');
      expect(callArgs).toContain(sinceDate.toISOString());
    });

    // Test to cover error branch
    it('handles errors properly in getUserActivitySummary', async () => {
      // Mock a query error
      const queryError = new Error('Failed to get activity summary');
      mockPrismaClient.$queryRaw.mockRejectedValue(queryError);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method and expect it to throw
      await expect(service.getUserActivitySummary({})).rejects.toThrow(
        'Failed to get activity summary'
      );

      // Verify error logging
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error during getting user activity summary',
          error: 'Failed to get activity summary',
        })
      );
    });
  });

  describe('executeRawQuery', () => {
    it('logs query information and uses injected PrismaClient', async () => {
      // Mock query results
      const mockResults = [{ count: 5 }];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method
      const sql = 'SELECT COUNT(*) as count FROM "User" WHERE "email" = $1';
      const params = ['user@example.com'];
      const result = await service.executeRawQuery(sql, params);

      // Verify logger was called for query start
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Executing raw query',
          sql: expect.any(String),
          paramCount: 1,
        })
      );

      // Verify prisma client was called with correct parameters
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();

      // Verify expected results
      expect(result).toEqual(mockResults);
    });

    // Test to cover executeRawQuery error branch (line 309)
    it('handles errors properly in executeRawQuery', async () => {
      // Mock a query error
      const queryError = new Error('Invalid SQL syntax');
      mockPrismaClient.$queryRaw.mockRejectedValue(queryError);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Execute the method and expect it to throw
      const sql = 'INVALID SQL STATEMENT';
      await expect(service.executeRawQuery(sql)).rejects.toThrow('Invalid SQL syntax');

      // Verify error logging
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error during executing raw query',
          error: 'Invalid SQL syntax',
        })
      );
    });

    // Test for SQL truncation logic
    it('truncates long SQL queries in logs', async () => {
      // Mock query results
      const mockResults: any[] = [];
      mockPrismaClient.$queryRaw.mockResolvedValue(mockResults);

      // Create service with mocked dependencies
      const service = new RawQueryServiceImpl(mockPrismaClient as any, mockLoggerService);

      // Create a long SQL query (> 100 chars)
      const longSql =
        'SELECT * FROM "User" WHERE "name" = $1 AND "email" = $2 AND "role" = $3 AND "status" = $4 AND "createdAt" > $5 AND "updatedAt" > $6 AND "lastLoginAt" > $7 AND "isActive" = $8';
      const params = [
        'test',
        'test@example.com',
        'user',
        'active',
        new Date(),
        new Date(),
        new Date(),
        true,
      ];

      // Execute the method
      await service.executeRawQuery(longSql, params);

      // Verify logger was called with truncated SQL
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Executing raw query',
          sql: expect.stringMatching(/^SELECT.*\.\.\.$/),
        })
      );

      // Verify the SQL was truncated to 100 chars plus "..."
      const logCall = mockLoggerService.debug.mock.calls[0][0];
      expect(logCall.sql.length).toBeLessThan(longSql.length);
      expect(logCall.sql.endsWith('...')).toBe(true);
    });
  });
});
