import { PrismaClient, Prisma } from '@prisma/client';
import { loggers } from '@/lib/logger'; // Import logger

/**
 * Class for database utility functions with dependency injection
 */
export class DatabaseUtils {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger = loggers.db
  ) {}

  /**
   * Check if database is accessible
   * Useful for health checks and startup validation
   */
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Simple query to check if database is accessible
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error({ err: error }, 'Database connection check failed');
      return false;
    }
  }

  /**
   * Execute operations in a transaction with appropriate error handling
   */
  async withTransaction<T>(
    operations: (
      tx: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
      >
    ) => Promise<T>,
    options?: {
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    return this.prisma.$transaction(operations, options);
  }
}

// Export individual functions that use the default prisma client
// This maintains backward compatibility with the existing API
import { prisma } from '@/lib/prisma';

// Create default instance using the global prisma client
const defaultDbUtils = new DatabaseUtils(prisma);

// Export compatible functions
export const checkDatabaseConnection = () => defaultDbUtils.checkDatabaseConnection();
export const withTransaction = <T>(
  operations: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >
  ) => Promise<T>,
  options?: {
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
) => defaultDbUtils.withTransaction(operations, options);

// Re-export other utility functions and types from the original utils.ts file
export {
  DatabaseErrorType,
  getDatabaseErrorType,
  isUniqueConstraintError,
  buildPartialMatchFilter,
  getPaginationConfig,
  withDatabaseRetry,
} from './utils';
