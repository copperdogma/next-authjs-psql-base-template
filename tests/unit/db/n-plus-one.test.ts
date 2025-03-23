import { prisma } from '../../../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../../../lib/db/user-service';

// Mock PrismaClient to track query execution
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');

  // Create a custom mock for PrismaClient
  const mockPrismaClient = jest.fn().mockImplementation(() => {
    const queryLog: string[] = [];

    // Create the base client with tracking
    const client: any = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn(),
      $transaction: jest.fn(callback => callback(client)),

      // Add tracking for user and session queries
      user: {
        findMany: jest.fn(async args => {
          // Check if this is an include query
          if (args?.include?.sessions) {
            queryLog.push('user.findMany with include sessions');
            // Return users with their sessions already included
            return [
              {
                id: 'user1',
                email: 'user1@example.com',
                name: 'User 1',
                sessions: [{ id: 'session1', userId: 'user1', expiresAt: new Date() }],
              },
              {
                id: 'user2',
                email: 'user2@example.com',
                name: 'User 2',
                sessions: [{ id: 'session2', userId: 'user2', expiresAt: new Date() }],
              },
            ];
          } else {
            queryLog.push('user.findMany');
            // Return mock data if needed
            return [
              { id: 'user1', email: 'user1@example.com', name: 'User 1' },
              { id: 'user2', email: 'user2@example.com', name: 'User 2' },
            ];
          }
        }),
        findUnique: jest.fn(async args => {
          if (args?.include?.sessions) {
            queryLog.push('user.findUnique with include sessions');
            return {
              id: 'user1',
              email: 'user1@example.com',
              name: 'User 1',
              sessions: [{ id: 'session1', userId: 'user1', expiresAt: new Date() }],
            };
          } else {
            queryLog.push('user.findUnique');
            return { id: 'user1', email: 'user1@example.com', name: 'User 1' };
          }
        }),
      },
      session: {
        findMany: jest.fn(async args => {
          // Track when sessions are queried, which params are used
          const whereClause = JSON.stringify(args.where || {});
          queryLog.push(`session.findMany: ${whereClause}`);

          if (args.where?.userId === 'user1') {
            return [{ id: 'session1', userId: 'user1', expiresAt: new Date() }];
          } else if (args.where?.userId === 'user2') {
            return [{ id: 'session2', userId: 'user2', expiresAt: new Date() }];
          }

          // Return empty for no filters
          return [];
        }),
      },
      _queryLog: queryLog,
      _getQueryCount: () => queryLog.length,
      _getQueriesOfType: (type: string) => queryLog.filter(q => q.startsWith(type)).length,
      _clearQueryLog: () => queryLog.splice(0, queryLog.length),
    };

    return client;
  });

  return {
    ...originalModule,
    PrismaClient: mockPrismaClient,
  };
});

// Mock our singleton for testing
jest.mock('../../../lib/prisma', () => {
  const mockClient = new (jest.requireMock('@prisma/client').PrismaClient)();
  return {
    prisma: mockClient,
    disconnectPrisma: jest.fn(),
  };
});

describe('N+1 Query Issues', () => {
  beforeEach(() => {
    // Clear mocks and query log before each test
    jest.clearAllMocks();
    (prisma as any)._clearQueryLog();
  });

  test('demonstrates N+1 problem when fetching users and their sessions separately', async () => {
    // Get all users
    const users = await prisma.user.findMany();

    // For each user, get their sessions (this is the N+1 problem)
    for (const user of users) {
      await prisma.session.findMany({
        where: { userId: user.id },
      });
    }

    // We expect 1 query for users + N queries for sessions (where N = number of users)
    const totalQueries = (prisma as any)._getQueryCount();
    const userQueries = (prisma as any)._getQueriesOfType('user.findMany');
    const sessionQueries = (prisma as any)._getQueriesOfType('session.findMany');

    // Verify that we have N+1 queries (1 for users + 2 for each user's sessions)
    expect(userQueries).toBe(1);
    expect(sessionQueries).toBe(2); // 2 users, so 2 session queries
    expect(totalQueries).toBe(3); // 1 + 2 = 3 total queries
  });

  test('optimized query pattern avoids N+1 problem using includes', async () => {
    // Use our optimized service that prevents N+1 queries
    const usersWithSessions = await getUsersWithSessions();

    // We expect only 1 or 2 queries total (one for users with include)
    const totalQueries = (prisma as any)._getQueryCount();

    // Check that we're using just one query with include
    expect(totalQueries).toBeLessThanOrEqual(2);

    // Also check that we have the same data structure/content
    expect(usersWithSessions).toHaveLength(2);
    expect(usersWithSessions[0]).toHaveProperty('sessions');
    expect(usersWithSessions[1]).toHaveProperty('sessions');

    // Verify we're not using multiple session queries
    const sessionQueries = (prisma as any)._getQueriesOfType('session.findMany');
    expect(sessionQueries).toBe(0);
  });
});

// Updated implementation of getUsersWithSessions to use our new service
async function getUsersWithSessions() {
  // Use the optimized service method instead of the N+1 pattern
  return UserService.getUsersWithSessions();
}
