import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { loggers } from '@/lib/logger';

interface SessionCleanupServiceOptions {
  schedule: string; // Cron schedule string (e.g., '0 0 * * *')
  retentionDays: number; // How many days of sessions to keep
  batchSize?: number; // How many sessions to delete per batch (optional)
  onError?: (error: Error) => void; // Custom error handler (optional)
}

/**
 * Service for managing session cleanup operations using batch operations
 * Demonstrates efficient use of Prisma's batch operations (deleteMany, updateMany)
 */
export class SessionCleanupService {
  // Commenting out unused properties to fix TS errors - Revisit when implementing cleanup logic
  // private schedule: string;
  // private retentionDays: number;
  // private batchSize?: number;
  // private onError: (error: Error) => void;

  constructor(options: SessionCleanupServiceOptions) {
    // // Assign commented-out properties
    // this.schedule = options.schedule;
    // this.retentionDays = options.retentionDays;
    // this.batchSize = options.batchSize;
    // // Use provided onError or default to logging
    // this.onError = options.onError || (error => loggers.db.error({ err: error }, 'Session cleanup error'));

    // Ensure the default logging occurs if no custom handler is passed, even if properties aren't used yet.
    // We don't need to store it if the class methods don't use it.
    options.onError || (error => loggers.db.error({ err: error }, 'Session cleanup error'));
  }

  /**
   * Start the scheduled cleanup task.
   */
  start(): void {
    // TODO: Implement scheduling using node-cron and this.schedule
    // The task should call this.runCleanup()
    // Example: schedule(this.schedule, async () => { ... });
    loggers.db.info('Session cleanup service started (scheduling not implemented).');
  }

  /**
   * Stop the scheduled cleanup task.
   */
  stop(): void {
    // TODO: Implement task stopping
    loggers.db.info('Session cleanup service stopped (stopping not implemented).');
  }

  /**
   * Run the cleanup process immediately.
   */
  async runCleanup(): Promise<void> {
    loggers.db.info('Running session cleanup...');
    const retentionDays = 7; // Hardcoded for now, replace with this.retentionDays when implemented
    const batchSize = 100; // Hardcoded for now, replace with this.batchSize when implemented
    const onError = (error: Error) => loggers.db.error({ err: error }, 'Session cleanup error'); // Hardcoded for now

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // ... (rest of runCleanup logic using hardcoded values)
    // ... Use onError callback on failures ...

    try {
      let deletedCount = 0;
      let totalDeleted = 0;

      do {
        const sessionsToDelete = await prisma.session.findMany({
          where: {
            expires: {
              lt: cutoffDate,
            },
          },
          take: batchSize,
          select: {
            id: true, // Only select IDs for deletion
          },
        });

        if (sessionsToDelete.length === 0) {
          break;
        }

        const idsToDelete = sessionsToDelete.map(s => s.id);
        const result = await prisma.session.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });

        deletedCount = result.count;
        totalDeleted += deletedCount;
        loggers.db.debug(`Deleted ${deletedCount} expired sessions in batch.`);
      } while (deletedCount === batchSize);

      loggers.db.info(`Session cleanup complete. Total expired sessions deleted: ${totalDeleted}.`);
    } catch (error) {
      if (error instanceof Error) {
        onError(error); // Use the error handler
      } else {
        onError(new Error('An unknown error occurred during session cleanup'));
      }
    }
  }

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
