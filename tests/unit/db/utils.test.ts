/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import {
  getDatabaseErrorType,
  DatabaseErrorType,
  checkDatabaseConnection,
  withTransaction,
  withDatabaseRetry,
  isUniqueConstraintError,
  buildPartialMatchFilter,
  getPaginationConfig,
} from '@/lib/db/utils';
import { prisma as globalPrisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

// Mock the global prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    // Mock other prisma methods if needed by the utils
  },
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  loggers: {
    db: {
      error: jest.fn(),
      // Mock other logger methods if needed
    },
  },
}));

// Helper to create Prisma errors for testing
const createPrismaError = (
  code: string,
  meta?: Record<string, unknown>
): Prisma.PrismaClientKnownRequestError => {
  return new Prisma.PrismaClientKnownRequestError('message', { code, clientVersion: 'test', meta });
};

describe('Database Utilities', () => {
  const mockedPrisma = jest.mocked(globalPrisma);
  const mockedLogger = jest.mocked(loggers.db);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDatabaseErrorType', () => {
    it('should return correct type for known request errors', () => {
      const error = createPrismaError(DatabaseErrorType.UniqueConstraintViolation);
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.UniqueConstraintViolation);
    });

    it('should return ConnectionError for initialization errors', () => {
      const error = new Prisma.PrismaClientInitializationError('message', 'test');
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.ConnectionError);
    });

    it('should return Unknown for generic errors', () => {
      const error = new Error('Generic error');
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.Unknown);
    });

    it('should return Unknown for null/undefined', () => {
      expect(getDatabaseErrorType(null)).toBe(DatabaseErrorType.Unknown);
      expect(getDatabaseErrorType(undefined)).toBe(DatabaseErrorType.Unknown);
    });
  });

  describe('isUniqueConstraintError', () => {
    it('should return true for unique constraint errors', () => {
      const error = createPrismaError(DatabaseErrorType.UniqueConstraintViolation);
      expect(isUniqueConstraintError(error)).toBe(true);
    });

    it('should return false for other known errors', () => {
      const error = createPrismaError(DatabaseErrorType.ForeignKeyConstraint);
      expect(isUniqueConstraintError(error)).toBe(false);
    });

    it('should return false for generic errors', () => {
      const error = new Error('Generic error');
      expect(isUniqueConstraintError(error)).toBe(false);
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return true on successful query', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue(1); // Mock successful query
      const result = await checkDatabaseConnection();
      expect(result).toBe(true);
      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(expect.any(Array));
      expect(mockedLogger.error).not.toHaveBeenCalled();
    });

    it('should return false and log error on query failure', async () => {
      const dbError = new Error('Connection failed');
      mockedPrisma.$queryRaw.mockRejectedValue(dbError);
      const result = await checkDatabaseConnection();
      expect(result).toBe(false);
      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(expect.any(Array));
      expect(mockedLogger.error).toHaveBeenCalledWith(
        { err: dbError },
        'Database connection check failed'
      );
    });
  });

  describe('withTransaction', () => {
    it('should call prisma.$transaction with the provided operations and options', async () => {
      const mockOperations = jest.fn<() => Promise<any>>().mockResolvedValue('result');
      const mockOptions = { timeout: 5000 };

      mockedPrisma.$transaction.mockImplementation(async (operations: any) => {
        const tx = {} as any; // Simulate a transaction object
        const result = await operations(tx);
        return result;
      });

      const result: string = await withTransaction(mockOperations, mockOptions);

      expect(result).toBe('result');
      expect(mockedPrisma.$transaction).toHaveBeenCalledWith(mockOperations, mockOptions);
      expect(mockOperations).toHaveBeenCalledWith(expect.anything()); // Operations called with tx
    });
  });

  describe('withDatabaseRetry', () => {
    // Store original console.warn and mock it for retry tests
    let originalConsoleWarn: any;
    beforeEach(() => {
      originalConsoleWarn = console.warn;
      console.warn = jest.fn();
    });

    afterEach(() => {
      // Restore original console.warn after retry tests
      console.warn = originalConsoleWarn;
    });

    it('should return result on first successful attempt', async () => {
      const mockOperation = jest.fn<() => Promise<string>>().mockResolvedValue('success');
      const result = await withDatabaseRetry(mockOperation);
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on specified retryable errors and succeed', async () => {
      const connectionError = new Prisma.PrismaClientInitializationError('connect failed', 'test');
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValue('success after retry');

      const result = await withDatabaseRetry(mockOperation, {
        retries: 3,
        delayMs: 10,
        retryableErrors: [DatabaseErrorType.ConnectionError],
      });

      expect(result).toBe('success after retry');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should throw immediately for non-retryable errors', async () => {
      const uniqueError = createPrismaError(DatabaseErrorType.UniqueConstraintViolation);
      const mockOperation = jest.fn<() => Promise<any>>().mockRejectedValue(uniqueError);

      await expect(
        withDatabaseRetry(mockOperation, {
          retries: 3,
          delayMs: 10,
          retryableErrors: [DatabaseErrorType.ConnectionError],
        })
      ).rejects.toThrow(uniqueError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw the last error for persistent retryable errors', async () => {
      const persistentError = new Prisma.PrismaClientInitializationError(
        'persistent connect failed',
        'test'
      );
      const mockOperation = jest.fn<() => Promise<any>>().mockRejectedValue(persistentError);

      await expect(
        withDatabaseRetry(mockOperation, {
          retries: 2, // Set to 2 for quicker test
          delayMs: 5,
          retryableErrors: [DatabaseErrorType.ConnectionError],
        })
      ).rejects.toThrow(persistentError);
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
    });
  });

  describe('buildPartialMatchFilter', () => {
    it('should return an empty object for empty search term', () => {
      expect(buildPartialMatchFilter('name', '')).toEqual({});
      expect(buildPartialMatchFilter('name', null as any)).toEqual({}); // null/undefined search terms
      expect(buildPartialMatchFilter('name', undefined as any)).toEqual({});
    });

    it('should create a contains insensitive filter for the specified field', () => {
      const filter = buildPartialMatchFilter('name', 'searchTerm');
      expect(filter).toEqual({
        name: { contains: 'searchTerm', mode: 'insensitive' },
      });
    });

    // If testing OR logic for multiple fields, the test itself would need to construct the OR array:
    // it('should allow constructing OR filters for multiple fields', () => {
    //   const nameFilter = buildPartialMatchFilter('name', 'searchTerm');
    //   const descriptionFilter = buildPartialMatchFilter('description', 'searchTerm');
    //   const combinedFilter = {
    //     OR: [
    //       nameFilter,
    //       descriptionFilter,
    //     ].filter(f => Object.keys(f).length > 0), // Filter out empty objects if searchTerm was empty for one field
    //   };
    //   // Assert combinedFilter structure
    // });
  });

  describe('getPaginationConfig', () => {
    it('should return default pagination if no params provided', () => {
      const config = getPaginationConfig({});
      expect(config).toEqual({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }); // Default pageSize is 20 now
    });

    it('should parse page and pageSize from valid number params', () => {
      const config = getPaginationConfig({ page: 2, pageSize: 20 });
      expect(config).toEqual({ skip: 20, take: 20, orderBy: { createdAt: 'desc' } });
    });

    it('should use default pageSize if only page is provided', () => {
      const config = getPaginationConfig({ page: 2 });
      expect(config).toEqual({ skip: 20, take: 20, orderBy: { createdAt: 'desc' } }); // (2-1)*20
    });

    it('should use default page (1) if only pageSize is provided', () => {
      const config = getPaginationConfig({ pageSize: 50 });
      expect(config).toEqual({ skip: 0, take: 50, orderBy: { createdAt: 'desc' } });
    });

    it('should use provided orderBy and orderDirection', () => {
      const config = getPaginationConfig({ orderBy: 'name', orderDirection: 'asc' });
      expect(config).toEqual({ skip: 0, take: 20, orderBy: { name: 'asc' } });
    });

    // Tests for clamping and invalid string inputs are no longer directly applicable
    // as the function now expects numbers and has defaults.
    // Clamping behavior is internal to how page/pageSize are used if they were to be out of typical bounds.
  });
});
