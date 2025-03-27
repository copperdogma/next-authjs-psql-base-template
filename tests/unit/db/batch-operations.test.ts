import { prisma } from '../../../lib/prisma';

// Mock PrismaClient to track batch operations
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');

  // Create a custom mock for PrismaClient
  const mockPrismaClient = jest.fn().mockImplementation(() => {
    const operationLog: { type: string; count: number; args: any }[] = [];

    interface MockPrismaClient {
      $connect: jest.Mock;
      $disconnect: jest.Mock;
      $transaction: jest.Mock;
      session: {
        delete: jest.Mock;
        deleteMany: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
      };
      _operationLog: typeof operationLog;
      _clearLog: () => void;
      _getOperationCount: (type: string) => number;
      _getTotalDeleted: () => number;
      _getOperations: () => typeof operationLog;
    }

    const client: MockPrismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(async callback => callback(client)),

      // Session model with batching operations
      session: {
        // Individual operation methods
        delete: jest.fn(async args => {
          operationLog.push({ type: 'session.delete', count: 1, args });
          return { id: 'session1', userId: 'user1', expiresAt: new Date() };
        }),
        deleteMany: jest.fn(async args => {
          // Log this operation as a batch operation
          const count = args?.where?.expiresAt?.lt ? 5 : 0; // Simulate deleting 5 expired sessions
          operationLog.push({ type: 'session.deleteMany', count, args });
          return { count };
        }),
        findMany: jest.fn(async args => {
          operationLog.push({ type: 'session.findMany', count: 10, args });

          // Generate mock sessions based on args
          const mockSessions = Array.from({ length: 10 }, (_, i) => ({
            id: `session${i}`,
            userId: `user${i % 3}`, // Distribute users across sessions
            expiresAt: new Date(Date.now() - i * 1000 * 60 * 60), // Some are expired
          }));

          return mockSessions;
        }),
        findFirst: jest.fn(async args => {
          operationLog.push({ type: 'session.findFirst', count: 1, args });

          // Return a mock session for the requested user
          if (args?.where?.userId) {
            return {
              id: `session_${args.where.userId}_current`,
              userId: args.where.userId,
              expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            };
          }

          return null;
        }),
      },

      // Operation log tracking methods
      _operationLog: operationLog,
      _clearLog: () => operationLog.splice(0, operationLog.length),
      _getOperationCount: (type: string) => {
        return operationLog.filter(op => op.type === type).reduce((sum, op) => sum + op.count, 0);
      },
      _getTotalDeleted: () => {
        return operationLog
          .filter((op: { type: string; count: number }) => op.type === 'session.deleteMany')
          .reduce((sum, op) => sum + op.count, 0);
      },
      _getOperations: () => [...operationLog],
    };

    return client;
  });

  return {
    ...originalModule,
    PrismaClient: mockPrismaClient,
  };
});

// Mock the prisma singleton for testing
jest.mock('../../../lib/prisma', () => {
  const mockClient = new (jest.requireMock('@prisma/client').PrismaClient)();
  return {
    prisma: mockClient,
    disconnectPrisma: jest.fn(),
  };
});

// Import the SessionCleanupService
import { SessionCleanupService } from '../../../lib/db/session-cleanup-service';

describe('Batch Session Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma as any)._clearLog();
  });

  test('inefficient session cleanup with individual deletes', async () => {
    // This demonstrates the inefficient way to delete expired sessions

    // Get expired sessions
    const now = new Date();
    const sessions = await prisma.session.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Delete each one individually (inefficient)
    for (const session of sessions) {
      await prisma.session.delete({
        where: { id: session.id },
      });
    }

    // We expect this to result in many individual delete operations
    const individualDeleteCount = (prisma as any)._getOperationCount('session.delete');
    expect(individualDeleteCount).toBeGreaterThan(1);
  });

  test('efficient session cleanup using batch operations', async () => {
    // This demonstrates the efficient way using batch operations

    // Set a cutoff date
    const now = new Date();

    // Use our cleanup service to delete expired sessions in a batch
    const result = await SessionCleanupService.cleanupExpiredSessions({ before: now });

    // Verify we're using deleteMany (batch operation)
    const operations = (prisma as any)._getOperations();
    const batchOperations = operations.filter(
      (op: { type: string; count: number; args: any }) => op.type === 'session.deleteMany'
    );

    // Check that we're actually using the batch operation
    expect(batchOperations.length).toBeGreaterThan(0);

    // Also check that we deleted some sessions and returned the count
    expect(result.count).toBeGreaterThan(0);

    // Verify we're not using individual deletes
    const individualDeleteCount = (prisma as any)._getOperationCount('session.delete');
    expect(individualDeleteCount).toBe(0);
  });

  test('user session cleanup maintains current session when needed', async () => {
    // Test the user-specific session cleanup that keeps current session
    const userId = 'user1';

    // Keep the current session when cleaning up user sessions
    const result = await SessionCleanupService.cleanupUserSessions(userId, {
      keepCurrent: true,
    });

    // Verify we're using the batch operation
    const operations = (prisma as any)._getOperations();
    const hasBatchDelete = operations.some(
      (op: { type: string; args: any }) => op.type === 'session.deleteMany' && op.args?.where?.userId === userId
    );

    expect(hasBatchDelete).toBe(true);
    expect(result.keptCurrentSession).toBeTruthy();
  });
});
