/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import {
  DatabaseErrorType,
  getDatabaseErrorType,
  isUniqueConstraintError,
  buildPartialMatchFilter,
  getPaginationConfig,
  withDatabaseRetry,
} from '../../../lib/db/utils';
import { Prisma } from '@prisma/client';

// Mock console.warn to avoid test failures
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Helper to create PrismaClientInitializationError
function createPrismaInitializationError(message: string) {
  const error = new Error(message);
  Object.setPrototypeOf(error, Prisma.PrismaClientInitializationError.prototype);
  (error as any).clientVersion = '4.0.0';
  return error as Prisma.PrismaClientInitializationError;
}

describe('Database Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDatabaseErrorType', () => {
    it('identifies Prisma unique constraint violations', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.UniqueConstraintViolation);
    });

    it('identifies Prisma foreign key constraint errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '4.0.0',
        meta: {},
      });
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.ForeignKeyConstraint);
    });

    it('identifies Prisma connection errors', () => {
      const error = createPrismaInitializationError('Connection failed');
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.ConnectionError);
    });

    it('returns Unknown for non-Prisma errors', () => {
      const error = new Error('Generic error');
      expect(getDatabaseErrorType(error)).toBe(DatabaseErrorType.Unknown);
    });
  });

  describe('isUniqueConstraintError', () => {
    it('returns true for unique constraint violations', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });
      expect(isUniqueConstraintError(error)).toBe(true);
    });

    it('returns false for other Prisma errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not a unique constraint', {
        code: 'P2003',
        clientVersion: '4.0.0',
        meta: {},
      });
      expect(isUniqueConstraintError(error)).toBe(false);
    });

    it('returns false for non-Prisma errors', () => {
      const error = new Error('Generic error');
      expect(isUniqueConstraintError(error)).toBe(false);
    });
  });

  describe('buildPartialMatchFilter', () => {
    it('creates a case-insensitive filter object', () => {
      const filter = buildPartialMatchFilter('name', 'test');
      expect(filter).toEqual({
        name: {
          contains: 'test',
          mode: 'insensitive',
        },
      });
    });

    it('returns empty object for empty search term', () => {
      const filter = buildPartialMatchFilter('name', '');
      expect(filter).toEqual({});
    });

    it('returns empty object for whitespace-only search term', () => {
      const filter = buildPartialMatchFilter('name', '   ');
      expect(filter).toEqual({});
    });

    it('returns empty object for undefined search term', () => {
      const filter = buildPartialMatchFilter('name', undefined as any);
      expect(filter).toEqual({});
    });
  });

  describe('getPaginationConfig', () => {
    it('returns default pagination configuration', () => {
      const config = getPaginationConfig();
      expect(config).toEqual({
        skip: 0,
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('calculates correct skip value based on page and pageSize', () => {
      const config = getPaginationConfig({ page: 3, pageSize: 10 });
      expect(config).toEqual({
        skip: 20, // (3-1) * 10
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('applies custom ordering', () => {
      const config = getPaginationConfig({
        orderBy: 'updatedAt',
        orderDirection: 'asc',
      });
      expect(config).toEqual({
        skip: 0,
        take: 20,
        orderBy: {
          updatedAt: 'asc',
        },
      });
    });
  });

  describe('withDatabaseRetry', () => {
    // Mock for setTimeout that will execute immediately
    let originalSetTimeout: typeof global.setTimeout;

    beforeEach(() => {
      jest.clearAllMocks();

      // Save original setTimeout
      originalSetTimeout = global.setTimeout;

      // Mock setTimeout to execute callback immediately
      global.setTimeout = jest.fn((callback: Function, _ms?: number) => {
        callback();
        return 123 as unknown as NodeJS.Timeout;
      });

      // Prevent console.warn from causing test failures
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('executes operation and returns result on success', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const result = await withDatabaseRetry(mockOperation);
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      // Create proper error objects
      const connectionError = createPrismaInitializationError('Connection failed');

      const timeoutError = new Prisma.PrismaClientKnownRequestError('Timeout', {
        code: 'P1008',
        clientVersion: '4.0.0',
        meta: {},
      });

      // Create mock operation with proper sequence
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const result = await withDatabaseRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('throws immediately on non-retryable errors', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });
      const mockOperation = jest.fn().mockRejectedValue(error);

      await expect(withDatabaseRetry(mockOperation)).rejects.toThrow(error);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('throws after all retries are exhausted', async () => {
      // Create a proper initialization error
      const connectionError = createPrismaInitializationError('Connection failed');

      // Mock operation will be called multiple times due to retries
      const mockOperation = jest.fn().mockRejectedValue(connectionError);

      // No need to mock setTimeout as it's already mocked in beforeEach to execute callbacks immediately

      await expect(withDatabaseRetry(mockOperation, { retries: 3, delayMs: 0 })).rejects.toThrow(
        'Connection failed'
      );

      // The operation is called multiple times due to how the retry logic works
      // When using the immediate setTimeout mock, calls happen right away
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('respects custom retryable errors config', async () => {
      // Allow retrying on unique constraint errors, which normally would not be retried
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });

      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(uniqueError)
        .mockResolvedValueOnce('success');

      // Temporarily disable the console.warn check for this test
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();

      try {
        const result = await withDatabaseRetry(mockOperation, {
          retryableErrors: [DatabaseErrorType.UniqueConstraintViolation],
          delayMs: 100,
        });

        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);
      } finally {
        console.warn = originalConsoleWarn;
      }
    });

    it('returns success after retrying a specified number of times', async () => {
      // Create a proper initialization error
      const connectionError = createPrismaInitializationError('Connection failed');

      // Mock operation that fails once then succeeds
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValue('success');

      const result = await withDatabaseRetry(mockOperation, { retries: 3, delayMs: 10 });
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('handles PrismaClientKnownRequestError', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });

      const mockOperation = jest.fn().mockRejectedValue(prismaError);

      await expect(withDatabaseRetry(mockOperation)).rejects.toThrow(prismaError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('handles PrismaClientKnownRequestError with non-retriable code', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
        meta: {},
      });

      const mockOperation = jest.fn().mockRejectedValue(prismaError);

      await expect(withDatabaseRetry(mockOperation)).rejects.toThrow(prismaError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });
});
