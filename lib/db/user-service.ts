import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * User service with optimized database query patterns
 */
export class UserService {
  /**
   * Get all users with their sessions efficiently (prevents N+1 query problem)
   * @param options Optional query options
   * @returns Array of users with their sessions
   */
  static async getUsersWithSessions(options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }) {
    return prisma.user.findMany({
      ...options,
      // Include sessions in a single query to prevent N+1 problem
      include: {
        sessions: true,
      },
    });
  }

  /**
   * Get a single user with their sessions
   * @param userId The user ID to find
   * @returns User with sessions or null if not found
   */
  static async getUserWithSessions(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
      },
    });
  }

  /**
   * Get users with filtering by session expiration
   * Shows advanced filtering pattern to avoid N+1 while applying constraints
   * @param options Filter options
   * @returns Users with filtered sessions
   */
  static async getUsersWithActiveSessions(options?: {
    skip?: number;
    take?: number;
    expiresAfter?: Date;
  }) {
    const { expiresAfter = new Date(), skip, take } = options || {};

    return prisma.user.findMany({
      skip,
      take,
      include: {
        sessions: {
          // Filter sessions within the include
          where: {
            expires: {
              gt: expiresAfter,
            },
          },
        },
      },
      // Only include users who have active sessions
      where: {
        sessions: {
          some: {
            expires: {
              gt: expiresAfter,
            },
          },
        },
      },
    });
  }

  /**
   * Get users with optimized performance using a custom query strategy
   * @param options Query options for pagination and filtering
   * @returns Array of users with session counts
   */
  static async getUsersWithSessionCounts(options?: { skip?: number; take?: number }) {
    const { skip, take } = options || {};

    // Using Prisma's count in select for performance
    return prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
  }
}
