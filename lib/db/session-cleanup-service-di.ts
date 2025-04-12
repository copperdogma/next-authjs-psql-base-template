import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { LoggerService } from '../interfaces/services';
import { createContextLogger } from '../services/logger-service';

/**
 * SessionCleanupService provides functionality for managing and cleaning up user sessions.
 * This version uses dependency injection for better testability and modularity.
 */
export interface SessionCleanupService {
  /**
   * Cleans up expired sessions based on provided criteria.
   * @param options Options for cleaning up sessions (before date, userId, older than days)
   * @returns Result including the count of deleted sessions and timestamp
   */
  cleanupExpiredSessions(options?: {
    before?: Date;
    userId?: string;
    olderThanDays?: number;
  }): Promise<{ count: number; timestamp: Date }>;

  /**
   * Cleans up all sessions for a specific user, optionally keeping the most recent one.
   * @param userId User ID to cleanup sessions for
   * @param options Additional options (keepCurrent)
   * @returns Result with count, whether current session was kept, and timestamp
   */
  cleanupUserSessions(
    userId: string,
    options?: {
      keepCurrent?: boolean;
    }
  ): Promise<{ count: number; keptCurrentSession: boolean; timestamp: Date }>;

  /**
   * Schedules regular cleanup of expired sessions using setInterval.
   * @param options Options for scheduling cleanup
   * @returns A function to cancel the scheduled cleanup
   */
  scheduleSessionCleanup(options?: {
    intervalMs?: number;
    runImmediately?: boolean;
    onComplete?: (result: { count: number; timestamp: Date }) => void;
    onError?: (error: Error) => void;
  }): () => void;
}

/**
 * Helper function to ensure a logger with proper context for database operations.
 * If the logger has child method, creates a child logger with db component.
 * Otherwise returns the original logger.
 */
function setupLogger(logger?: LoggerService): LoggerService {
  if (!logger) {
    // Create a default logger with DB context
    return createContextLogger('db', {
      transport:
        process.env.NODE_ENV === 'production'
          ? {
              target: 'pino/file',
              options: {
                destination: process.env.LOG_FILE || 'logs/db.log',
                mkdir: true,
              },
            }
          : undefined,
    });
  }

  // If logger has child method, create a child logger with db component
  if (logger.child && typeof logger.child === 'function') {
    try {
      return logger.child({ component: 'db' });
    } catch {
      console.warn('Failed to create child logger, using base logger instead');
      return logger;
    }
  }

  // Fall back to the original logger
  return logger;
}

/**
 * Helper function for safely calling logger methods with fallback
 */
function createSafeLogger(dbLogger: LoggerService) {
  return (
    level: 'info' | 'error' | 'warn' | 'debug',
    data: Record<string, unknown>,
    message: string
  ) => {
    if (typeof dbLogger[level] === 'function') {
      dbLogger[level](data, message);
    } else if (level === 'error') {
      // Fallback to console.error for errors only
      console.error(message, data);
    }
  };
}

/**
 * Implementation of cleanupExpiredSessions with dependency injection
 */
function createCleanupExpiredSessions(
  prisma: PrismaClient,
  safeLog: ReturnType<typeof createSafeLogger>
) {
  return async function cleanupExpiredSessions(
    options: {
      before?: Date;
      userId?: string;
      olderThanDays?: number;
    } = {}
  ) {
    // Add default empty object for options
    const { before = new Date(), userId, olderThanDays } = options;

    // Calculate the cutoff date if olderThanDays is provided
    let cutoffDate = before;
    if (olderThanDays) {
      cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    }

    // Build where conditions for the batch operation
    const where: Prisma.SessionWhereInput = {
      expires: { lt: cutoffDate },
    };

    // Add user filter if specified
    if (userId) {
      where.userId = userId;
    }

    try {
      // Batch delete expired sessions with a single query
      const result = await prisma.session.deleteMany({ where });

      // Log success
      safeLog(
        'info',
        { count: result.count, criteria: { before: cutoffDate, userId } },
        'Expired sessions cleaned successfully.'
      );

      return {
        count: result.count,
        timestamp: new Date(),
      };
    } catch (error) {
      // Log error
      safeLog(
        'error',
        { err: error, criteria: { before: cutoffDate, userId } },
        'Failed to cleanup expired sessions'
      );

      // Re-throw error
      throw error;
    }
  };
}

/**
 * Implementation for finding a user's current session
 */
function createFindCurrentSession(
  prisma: PrismaClient,
  safeLog: ReturnType<typeof createSafeLogger>
) {
  return async function findCurrentSession(userId: string): Promise<string | undefined> {
    try {
      const currentSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { expires: 'desc' },
        select: { id: true }, // Only need the ID
      });
      return currentSession?.id;
    } catch (error) {
      safeLog('error', { err: error, userId }, 'Failed to find current session for user');

      // Throwing seems safer as proceeding might delete the current session
      throw error;
    }
  };
}

/**
 * Implementation of cleanupUserSessions with dependency injection
 */
function createCleanupUserSessions(
  prisma: PrismaClient,
  safeLog: ReturnType<typeof createSafeLogger>,
  findCurrentSession: (userId: string) => Promise<string | undefined>
) {
  return async function cleanupUserSessions(
    userId: string,
    options: {
      keepCurrent?: boolean;
    } = {}
  ) {
    const { keepCurrent = false } = options;

    let currentSessionId: string | undefined;
    if (keepCurrent) {
      currentSessionId = await findCurrentSession(userId);
    }

    // Build where conditions for the batch delete
    const where: Prisma.SessionWhereInput = { userId };

    // Exclude current session if found and requested
    if (currentSessionId) {
      where.id = { not: currentSessionId };
    }

    try {
      // Batch delete all other sessions for this user
      const result = await prisma.session.deleteMany({ where });

      safeLog(
        'info',
        { count: result.count, userId, keptCurrent: !!currentSessionId },
        'User sessions cleaned successfully.'
      );

      return {
        count: result.count,
        keptCurrentSession: Boolean(currentSessionId),
        timestamp: new Date(),
      };
    } catch (error) {
      safeLog('error', { err: error, userId }, 'Failed to cleanup user sessions');

      throw error;
    }
  };
}

/**
 * Implementation of scheduleSessionCleanup with dependency injection
 */
function createScheduleSessionCleanup(
  cleanupExpiredSessions: SessionCleanupService['cleanupExpiredSessions'],
  safeLog: ReturnType<typeof createSafeLogger>
) {
  return function scheduleSessionCleanup(
    options: {
      intervalMs?: number;
      runImmediately?: boolean;
      onComplete?: (result: { count: number; timestamp: Date }) => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    const {
      intervalMs = 24 * 60 * 60 * 1000, // Default to daily
      runImmediately = true,
      onComplete = result => {
        safeLog('info', { result }, 'Scheduled session cleanup complete');
      },
      onError = error => {
        safeLog('error', { err: error }, 'Scheduled session cleanup failed');
      },
    } = options;

    const runJob = () => {
      cleanupExpiredSessions().then(onComplete).catch(onError);
    };

    if (runImmediately) {
      runJob();
    }

    // Setup interval for regular cleanup
    const intervalId = setInterval(runJob, intervalMs);
    safeLog('info', { intervalMs }, 'Session cleanup scheduled.');

    // Return a function to cancel the scheduled cleanup
    return () => {
      clearInterval(intervalId);
      safeLog('info', {}, 'Session cleanup schedule cancelled.');
    };
  };
}

/**
 * Creates a SessionCleanupService with dependency injection
 *
 * @param prisma - PrismaClient instance to use for database operations
 * @param logger - LoggerService to use for logging
 * @returns SessionCleanupService implementation
 */
export function createSessionCleanupService(
  prismaClient: PrismaClient = prisma,
  logger?: LoggerService
): SessionCleanupService {
  const dbLogger = setupLogger(logger);
  const safeLog = createSafeLogger(dbLogger);

  // Create functions with DI
  const cleanupExpiredSessionsFn = createCleanupExpiredSessions(prismaClient, safeLog);
  const findCurrentSessionFn = createFindCurrentSession(prismaClient, safeLog);
  const cleanupUserSessionsFn = createCleanupUserSessions(
    prismaClient,
    safeLog,
    findCurrentSessionFn
  );
  const scheduleSessionCleanupFn = createScheduleSessionCleanup(cleanupExpiredSessionsFn, safeLog);

  // Return interface implementation
  return {
    cleanupExpiredSessions: cleanupExpiredSessionsFn,
    cleanupUserSessions: cleanupUserSessionsFn,
    scheduleSessionCleanup: scheduleSessionCleanupFn,
  };
}

// Create default instance for backward compatibility
const defaultService = createSessionCleanupService();

// Export individual functions for backward compatibility
export const { cleanupExpiredSessions, cleanupUserSessions, scheduleSessionCleanup } =
  defaultService;
