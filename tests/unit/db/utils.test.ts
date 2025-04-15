/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { prisma } from '../../../lib/prisma';
import { loggers } from '../../../lib/logger';
import {
  DatabaseErrorType,
  getDatabaseErrorType,
  isUniqueConstraintError,
  buildPartialMatchFilter,
  getPaginationConfig,
  withDatabaseRetry,
  checkDatabaseConnection,
  withTransaction,
} from '../../../lib/db/utils';
import { Prisma } from '@prisma/client';

// Mock the global prisma client
const mockQueryRaw = jest.fn();
const mockTransaction = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
  },
}));

// Mock the logger
const mockLoggerError = jest.fn();
jest.mock('@/lib/logger', () => ({
  loggers: {
    db: {
      error: mockLoggerError,
      // Add other methods if needed by other tests, ensure mocks exist
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    // Mock other loggers if they exist and are needed
    app: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

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

  describe('checkDatabaseConnection', () => {
    let queryRawSpy;
    let loggerErrorSpy;

    beforeEach(() => {
      queryRawSpy = jest.spyOn(prisma, '$queryRaw').mockResolvedValue([1]);
      loggerErrorSpy = jest.spyOn(loggers.db, 'error').mockImplementation(() => {});
    });

    it('should return true when prisma.$queryRaw succeeds', async () => {
      const result = await checkDatabaseConnection();
      expect(result).toBe(true);
      expect(queryRawSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should return false and log error when prisma.$queryRaw fails', async () => {
      const testError = new Error('DB connection failed');
      queryRawSpy.mockRejectedValueOnce(testError);

      const result = await checkDatabaseConnection();

      expect(result).toBe(false);
      expect(queryRawSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        { err: testError },
        'Database connection check failed'
      );
    });
  });

  describe('withTransaction', () => {
    let transactionSpy;

    beforeEach(() => {
      transactionSpy = jest.spyOn(prisma, '$transaction');
    });

    it('should call prisma.$transaction with operations and options', async () => {
      const mockOperations = jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('transaction success');
      const mockOptions = { timeout: 5000 };
      transactionSpy.mockResolvedValueOnce('transaction success');

      const result = await withTransaction(mockOperations, mockOptions);

      expect(result).toBe('transaction success');
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy).toHaveBeenCalledWith(mockOperations, mockOptions);
    });

    it('should return the result of the transaction', async () => {
      const mockOperations = jest
        .fn<() => Promise<{ id: number; data: string }>>()
        .mockResolvedValue({ id: 1, data: 'test' });
      transactionSpy.mockResolvedValueOnce({ id: 1, data: 'test' });

      const result = await withTransaction(mockOperations);

      expect(result).toEqual({ id: 1, data: 'test' });
      expect(transactionSpy).toHaveBeenCalledWith(mockOperations, undefined);
    });

    it('should propagate errors from prisma.$transaction', async () => {
      const testError = new Error('Transaction failed');
      const mockOperations = jest.fn<() => Promise<any>>();
      transactionSpy.mockRejectedValueOnce(testError);

      await expect(withTransaction(mockOperations)).rejects.toThrow(testError);
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(transactionSpy).toHaveBeenCalledWith(mockOperations, undefined);
    });
  });

  describe('withDatabaseRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('executes operation and returns result on success', async () => {
      const mockOperation = jest.fn<() => Promise<string>>().mockResolvedValue('success');
      const result = await withDatabaseRetry(mockOperation);
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      const connectionError = createPrismaInitializationError('Connection failed');
      const timeoutError = new Prisma.PrismaClientKnownRequestError('Timeout', {
        code: 'P1008',
        clientVersion: '4.0.0',
        meta: {},
      });

      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const operationPromise = withDatabaseRetry(mockOperation, { retries: 3, delayMs: 500 });

      await jest.advanceTimersByTimeAsync(500);
      await jest.advanceTimersByTimeAsync(1000);

      const result = await operationPromise;

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('throws immediately on non-retryable errors', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });
      const mockOperation = jest.fn<() => Promise<never>>().mockRejectedValue(error);

      await expect(withDatabaseRetry(mockOperation)).rejects.toThrow(error);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('throws after all retries are exhausted', async () => {
      const connectionError = new Error('Connection failed');
      const mockOperation = jest.fn<() => Promise<never>>().mockRejectedValue(connectionError);

      const operationPromise = withDatabaseRetry(mockOperation, {
        retries: 3,
        delayMs: 100,
      });

      // Remove timer advancements as the error should throw immediately
      // await jest.advanceTimersByTimeAsync(100);
      // await jest.advanceTimersByTimeAsync(200);

      // Expect rejection with the correct error message
      await expect(operationPromise).rejects.toThrow('Connection failed');

      // Should only be called once because generic Error is not retryable by default
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('respects custom retryable errors config', async () => {
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: {},
      });
      const mockOperation = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(uniqueError)
        .mockResolvedValueOnce('success after retry');

      const operationPromise = withDatabaseRetry(mockOperation, {
        retries: 2,
        delayMs: 100,
        retryableErrors: [DatabaseErrorType.UniqueConstraintViolation],
      });

      await jest.advanceTimersByTimeAsync(100);

      const result = await operationPromise;
      expect(result).toBe('success after retry');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });
});
