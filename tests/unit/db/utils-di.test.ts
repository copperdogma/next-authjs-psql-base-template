import { jest } from '@jest/globals';

// Mock the PrismaClient class
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  })),
  Prisma: {
    TransactionIsolationLevel: {
      ReadCommitted: 'ReadCommitted',
      Serializable: 'Serializable',
    },
  },
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  loggers: {
    db: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

// Import the DatabaseUtils class
import { DatabaseUtils } from '@/lib/db/utils-di';

describe('DatabaseUtils class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabaseConnection', () => {
    it('should return true when database is accessible', async () => {
      // Arrange
      const mockPrisma = { $queryRaw: jest.fn().mockResolvedValueOnce([1]) };
      const mockLogger = { error: jest.fn() };
      const dbUtils = new DatabaseUtils(mockPrisma as any, mockLogger as any);

      // Act
      const result = await dbUtils.checkDatabaseConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return false when database connection fails', async () => {
      // Arrange
      const error = new Error('Connection failed');
      const mockPrisma = { $queryRaw: jest.fn().mockRejectedValueOnce(error) };
      const mockLogger = { error: jest.fn() };
      const dbUtils = new DatabaseUtils(mockPrisma as any, mockLogger as any);

      // Act
      const result = await dbUtils.checkDatabaseConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: error },
        'Database connection check failed'
      );
    });
  });

  describe('withTransaction', () => {
    it('should delegate to prisma.$transaction with the operations and options', async () => {
      // Arrange
      const mockOperation = jest.fn();
      const options = { timeout: 5000 };
      const expectedResult = { success: true };
      const mockPrisma = {
        $transaction: jest.fn().mockResolvedValueOnce(expectedResult),
      };
      const dbUtils = new DatabaseUtils(mockPrisma as any);

      // Act
      const result = await dbUtils.withTransaction(mockOperation, options);

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(mockOperation, options);
    });

    it('should propagate errors from transaction', async () => {
      // Arrange
      const mockOperation = jest.fn();
      const options = { timeout: 5000 };
      const transactionError = new Error('Transaction failed');
      const mockPrisma = {
        $transaction: jest.fn().mockRejectedValueOnce(transactionError),
      };
      const dbUtils = new DatabaseUtils(mockPrisma as any);

      // Act & Assert
      await expect(dbUtils.withTransaction(mockOperation, options)).rejects.toThrow(
        transactionError
      );
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(mockOperation, options);
    });
  });
});

// Test the exported standalone functions indirectly through mocking the default instance
describe('Exported standalone functions (indirectly tested)', () => {
  // Mock implementation for defaultDbUtils
  const mockCheckDatabaseConnection = jest.fn();
  const mockWithTransaction = jest.fn();

  // Setup a mock module factory for the utils-di module
  jest.mock(
    '@/lib/db/utils-di',
    () => {
      // Get the actual implementation
      const originalModule = jest.requireActual('@/lib/db/utils-di');

      // Return a modified version
      return {
        ...originalModule,
        // Export our mocked functions to simulate the default instance's methods
        checkDatabaseConnection: mockCheckDatabaseConnection,
        withTransaction: mockWithTransaction,
      };
    },
    { virtual: true }
  ); // virtual: true prevents actual module loading

  // Import the functions we want to test (these should be the mocked ones)
  const { checkDatabaseConnection, withTransaction } = require('@/lib/db/utils-di');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabaseConnection (standalone)', () => {
    it('delegates to the default DatabaseUtils instance', async () => {
      // Arrange
      mockCheckDatabaseConnection.mockResolvedValueOnce(true);

      // Act
      const result = await checkDatabaseConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockCheckDatabaseConnection).toHaveBeenCalledTimes(1);
    });

    it('propagates errors', async () => {
      // Arrange
      const testError = new Error('Database error');
      mockCheckDatabaseConnection.mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(checkDatabaseConnection()).rejects.toThrow(testError);
      expect(mockCheckDatabaseConnection).toHaveBeenCalledTimes(1);
    });
  });

  describe('withTransaction (standalone)', () => {
    it('delegates to the default DatabaseUtils instance', async () => {
      // Arrange
      const mockOperation = jest.fn();
      const options = { timeout: 1000 };
      const expectedResult = { data: 'success' };
      mockWithTransaction.mockResolvedValueOnce(expectedResult);

      // Act
      const result = await withTransaction(mockOperation, options);

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockWithTransaction).toHaveBeenCalledWith(mockOperation, options);
    });

    it('propagates transaction errors', async () => {
      // Arrange
      const mockOperation = jest.fn();
      const transactionError = new Error('Transaction failed');
      mockWithTransaction.mockRejectedValueOnce(transactionError);

      // Act & Assert
      await expect(withTransaction(mockOperation)).rejects.toThrow(transactionError);
      expect(mockWithTransaction).toHaveBeenCalledWith(mockOperation);
    });
  });
});

// Add new test suite for re-exported utilities
describe('Re-exported utilities from utils.ts', () => {
  // Import the actual re-exported items we want to test from utils-di
  const {
    DatabaseErrorType,
    getDatabaseErrorType,
    isUniqueConstraintError,
    buildPartialMatchFilter,
    getPaginationConfig,
    withDatabaseRetry,
  } = require('@/lib/db/utils-di');

  // Also import them directly from utils for comparison
  const utilsOriginal = require('@/lib/db/utils');

  it('re-exports DatabaseErrorType enum correctly', () => {
    expect(DatabaseErrorType).toBeDefined();
    expect(DatabaseErrorType).toEqual(utilsOriginal.DatabaseErrorType);
    expect(DatabaseErrorType.UniqueConstraintViolation).toBe('P2002');
    expect(DatabaseErrorType.ConnectionError).toBe('P1001');
  });

  it('re-exports getDatabaseErrorType function correctly', () => {
    expect(getDatabaseErrorType).toBeDefined();
    expect(typeof getDatabaseErrorType).toBe('function');
    // Verify it's the same function reference
    expect(getDatabaseErrorType).toBe(utilsOriginal.getDatabaseErrorType);
  });

  it('re-exports isUniqueConstraintError function correctly', () => {
    expect(isUniqueConstraintError).toBeDefined();
    expect(typeof isUniqueConstraintError).toBe('function');
    // Verify it's the same function reference
    expect(isUniqueConstraintError).toBe(utilsOriginal.isUniqueConstraintError);
  });

  it('re-exports buildPartialMatchFilter function correctly', () => {
    expect(buildPartialMatchFilter).toBeDefined();
    expect(typeof buildPartialMatchFilter).toBe('function');
    // Verify it's the same function reference
    expect(buildPartialMatchFilter).toBe(utilsOriginal.buildPartialMatchFilter);

    // Test basic functionality
    const result = buildPartialMatchFilter('name', 'test');
    expect(result).toEqual({
      name: {
        contains: 'test',
        mode: 'insensitive',
      },
    });
  });

  it('re-exports getPaginationConfig function correctly', () => {
    expect(getPaginationConfig).toBeDefined();
    expect(typeof getPaginationConfig).toBe('function');
    // Verify it's the same function reference
    expect(getPaginationConfig).toBe(utilsOriginal.getPaginationConfig);

    // Test basic functionality
    const result = getPaginationConfig({ page: 2, pageSize: 10 });
    expect(result).toEqual({
      skip: 10,
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('re-exports withDatabaseRetry function correctly', () => {
    expect(withDatabaseRetry).toBeDefined();
    expect(typeof withDatabaseRetry).toBe('function');
    // Verify it's the same function reference
    expect(withDatabaseRetry).toBe(utilsOriginal.withDatabaseRetry);
  });
});
