import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Error types for database operations to better handle specific failures
 */
export enum DatabaseErrorType {
  UniqueConstraintViolation = 'P2002',
  ForeignKeyConstraint = 'P2003',
  RecordNotFound = 'P2001',
  ConnectionError = 'P1001',
  Timeout = 'P1008',
  Unknown = 'Unknown',
}

/**
 * Extract error type from Prisma error
 * @param error Any caught error
 * @returns The DatabaseErrorType
 */
export function getDatabaseErrorType(error: unknown): DatabaseErrorType {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code as DatabaseErrorType;
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return DatabaseErrorType.ConnectionError;
  }
  
  return DatabaseErrorType.Unknown;
}

/**
 * Check if database is accessible
 * Useful for health checks and startup validation
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Safely execute a database operation with retry capability
 * @param operation Function that performs a database operation
 * @param options Configuration options
 * @returns Result of the operation
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: { 
    retries?: number; 
    delayMs?: number;
    retryableErrors?: DatabaseErrorType[];
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delayMs = 500,
    retryableErrors = [
      DatabaseErrorType.ConnectionError,
      DatabaseErrorType.Timeout,
    ],
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorType = getDatabaseErrorType(error);
      
      // Only retry on certain error types
      if (!retryableErrors.includes(errorType)) {
        throw error;
      }
      
      // Last attempt, don't delay just throw
      if (attempt >= retries - 1) {
        throw error;
      }
      
      // Wait with exponential backoff before retry
      const delay = delayMs * Math.pow(2, attempt);
      console.warn(`Database operation failed (attempt ${attempt + 1}/${retries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Execute operations in a transaction with appropriate error handling
 */
export async function withTransaction<T>(
  operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options?: {
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  return prisma.$transaction(operations, options);
}

/**
 * Check if an error is a unique constraint violation
 * Useful for returning appropriate error messages to users
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === DatabaseErrorType.UniqueConstraintViolation
  );
}

/**
 * Build a partial match filter for full-text search
 * @param field The field to search in
 * @param searchTerm The search term to look for
 * @returns A Prisma filter object
 */
export function buildPartialMatchFilter(field: string, searchTerm: string): any {
  // Skip empty search terms
  if (!searchTerm?.trim()) {
    return {};
  }
  
  // Basic case-insensitive search
  return {
    [field]: {
      contains: searchTerm,
      mode: 'insensitive'
    }
  };
}

/**
 * Helper to create a paginated query
 * @param options Pagination options
 * @returns Prisma pagination configuration
 */
export function getPaginationConfig(options: {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    pageSize = 20,
    orderBy = 'createdAt',
    orderDirection = 'desc',
  } = options;
  
  const skip = (page - 1) * pageSize;
  
  return {
    skip,
    take: pageSize,
    orderBy: {
      [orderBy]: orderDirection,
    },
  };
} 