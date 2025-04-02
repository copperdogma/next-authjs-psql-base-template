import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Service for managing session cleanup operations using batch operations
 * Demonstrates efficient use of Prisma's batch operations (deleteMany, updateMany)
 */
export class SessionCleanupService {
  /**
   * Cleanup expired sessions in a single batch operation
   * @param options Options for cleaning up sessions
   * @returns Result of the cleanup operation including count of deleted sessions
   */
  static async cleanupExpiredSessions(options: {
    before?: Date;
    userId?: string;
    olderThanDays?: number;
  }) {
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

    // Batch delete expired sessions with a single query
    const result = await prisma.session.deleteMany({ where });

    return {
      count: result.count,
      timestamp: new Date(),
    };
  }

  /**
   * Cleanup sessions for a specific user in a batch
   * @param userId User ID to cleanup sessions for
   * @param options Additional options
   * @returns Result of the cleanup operation
   */
  static async cleanupUserSessions(
    userId: string,
    options: {
      keepCurrent?: boolean; // If true, keeps the most recent session
    } = {}
  ) {
    const { keepCurrent = false } = options;

    // Get the most recent session if we need to keep it
    let currentSessionId: string | undefined;
    if (keepCurrent) {
      const currentSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { expires: 'desc' },
      });

      if (currentSession) {
        currentSessionId = currentSession.id;
      }
    }

    // Build where conditions for the batch delete
    const where: Prisma.SessionWhereInput = { userId };

    // Exclude current session if needed
    if (currentSessionId) {
      where.id = { not: currentSessionId };
    }

    // Batch delete all other sessions for this user
    const result = await prisma.session.deleteMany({ where });

    return {
      count: result.count,
      keptCurrentSession: Boolean(currentSessionId),
      timestamp: new Date(),
    };
  }

  /**
   * Schedule regular cleanup of expired sessions
   * Useful for serverless environments or server startup
   * @param options Options for scheduling cleanup
   */
  static scheduleCleanup(
    options: {
      intervalMs?: number;
      onComplete?: (result: { count: number; timestamp: Date }) => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    const {
      intervalMs = 24 * 60 * 60 * 1000, // Default to daily
      onComplete = () => {},
      onError = error => console.error('Session cleanup error:', error),
    } = options;

    // Perform initial cleanup
    this.cleanupExpiredSessions({ before: new Date() }).then(onComplete).catch(onError);

    // Setup interval for regular cleanup
    const intervalId = setInterval(() => {
      this.cleanupExpiredSessions({ before: new Date() }).then(onComplete).catch(onError);
    }, intervalMs);

    // Return a function to cancel the scheduled cleanup
    return () => clearInterval(intervalId);
  }
}
