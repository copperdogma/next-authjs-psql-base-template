// =============================================================================
// Unit Testing Note:
// Unit testing batch database operations, especially with Prisma in Jest,
// presents significant environment and mocking challenges. Direct unit tests
// for this service were skipped due to persistent PrismaClient initialization
// errors in the test environment.
//
// Validation Strategy:
// The functionality of batch session cleanup is primarily validated through
// dedicated integration tests that run these operations against a test
// database and verify the outcome.
// =============================================================================
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { loggers } from '@/lib/logger';

const dbLogger = loggers.db;

/**
 * Cleans up expired sessions based on provided criteria.
 * Demonstrates efficient use of Prisma's batch operations (deleteMany).
 *
 * @param options Options for cleaning up sessions:
 *   - before?: Date - Delete sessions expiring before this date (defaults to now).
 *   - userId?: string - Only delete sessions for this user.
 *   - olderThanDays?: number - Delete sessions older than this many days (overrides 'before').
 * @returns Result including the count of deleted sessions.
 */
interface CleanupResult {
  count: number;
  timestamp: Date;
}

export async function cleanupExpiredSessions(
  options: {
    before?: Date;
    userId?: string;
    olderThanDays?: number;
  } = {}
): Promise<CleanupResult> {
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
    dbLogger.info(
      { count: result.count, criteria: { before: cutoffDate, userId } },
      'Expired sessions cleaned successfully.'
    );
    return {
      count: result.count,
      timestamp: new Date(),
    };
  } catch (error) {
    dbLogger.error(
      { err: error, criteria: { before: cutoffDate, userId } },
      'Failed to cleanup expired sessions'
    );
    // Re-throw or return an error indicator based on desired handling
    throw error; // Re-throwing for now
  }
}

/**
 * Cleans up all sessions for a specific user, optionally keeping the most recent one.
 *
 * @param userId User ID to cleanup sessions for.
 * @param options Additional options:
 *   - keepCurrent?: boolean - If true, keeps the most recent session (defaults to false).
 * @returns Result including the count of deleted sessions and whether the current one was kept.
 */
interface UserCleanupResult {
  count: number;
  keptCurrentSession: boolean;
  timestamp: Date;
}

export async function cleanupUserSessions(
  userId: string,
  options: {
    keepCurrent?: boolean;
  } = {}
): Promise<UserCleanupResult> {
  const { keepCurrent = false } = options;

  let currentSessionId: string | undefined;
  if (keepCurrent) {
    try {
      const currentSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { expires: 'desc' },
        select: { id: true }, // Only need the ID
      });
      currentSessionId = currentSession?.id;
    } catch (error) {
      dbLogger.error({ err: error, userId }, 'Failed to find current session for user');
      // Decide whether to proceed or throw. Proceeding might delete the current session.
      // Throwing seems safer.
      throw error;
    }
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
    dbLogger.info(
      { count: result.count, userId, keptCurrent: !!currentSessionId },
      'User sessions cleaned successfully.'
    );
    return {
      count: result.count,
      keptCurrentSession: Boolean(currentSessionId),
      timestamp: new Date(),
    };
  } catch (error) {
    dbLogger.error({ err: error, userId }, 'Failed to cleanup user sessions');
    throw error;
  }
}

/**
 * Schedules regular cleanup of expired sessions using setInterval.
 *
 * @param options Options for scheduling cleanup:
 *   - intervalMs?: number - Interval in milliseconds (defaults to 24 hours).
 *   - runImmediately?: boolean - Run cleanup immediately on schedule (defaults to true).
 *   - onComplete?: (result) => void - Callback on successful cleanup.
 *   - onError?: (error) => void - Callback on cleanup error.
 * @returns A function to cancel the scheduled cleanup.
 */
export function scheduleSessionCleanup(
  options: {
    intervalMs?: number;
    runImmediately?: boolean;
    onComplete?: (result: CleanupResult) => void;
    onError?: (error: Error) => void;
  } = {}
): () => void {
  const {
    intervalMs = 24 * 60 * 60 * 1000, // Default to daily
    runImmediately = true,
    onComplete = result => dbLogger.info({ result }, 'Scheduled session cleanup complete'),
    onError = error => dbLogger.error({ err: error }, 'Scheduled session cleanup failed'),
  } = options;

  const runJob = () => {
    cleanupExpiredSessions().then(onComplete).catch(onError);
  };

  if (runImmediately) {
    runJob();
  }

  // Setup interval for regular cleanup
  const intervalId = setInterval(runJob, intervalMs);
  dbLogger.info({ intervalMs }, 'Session cleanup scheduled.');

  // Return a function to cancel the scheduled cleanup
  return () => {
    clearInterval(intervalId);
    dbLogger.info('Session cleanup schedule cancelled.');
  };
}
