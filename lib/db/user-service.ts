import { prisma } from '../prisma';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * User service with optimized database query patterns
 */
export class UserService {
  private prisma: PrismaClient;

  /**
   * Initialize user service with optional PrismaClient instance
   * @param prismaClient Optional PrismaClient instance (defaults to global instance)
   */
  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Get all users with their sessions efficiently (prevents N+1 query problem)
   * @param options Optional query options
   * @returns Array of users with their sessions
   */
  async getUsersWithSessions(options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }) {
    return this.prisma.user.findMany({
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
  async getUserWithSessions(userId: string) {
    return this.prisma.user.findUnique({
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
  async getUsersWithActiveSessions(options?: {
    skip?: number;
    take?: number;
    expiresAfter?: Date;
  }) {
    const { expiresAfter = new Date(), skip, take } = options || {};

    return this.prisma.user.findMany({
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
  async getUsersWithSessionCounts(options?: { skip?: number; take?: number }) {
    const { skip, take } = options || {};

    // Using Prisma's count in select for performance
    return this.prisma.user.findMany({
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

// Create a default instance for backward compatibility
export const userServiceInstance = new UserService();

/**
 * Get all users with their sessions efficiently (prevents N+1 query problem)
 * @param options Optional query options
 * @returns Array of users with their sessions
 * @deprecated Use UserService instance methods instead
 */
export const getUsersWithSessions = (options?: {
  skip?: number;
  take?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
  where?: Prisma.UserWhereInput;
}) => userServiceInstance.getUsersWithSessions(options);

/**
 * Get a single user with their sessions
 * @param userId The user ID to find
 * @returns User with sessions or null if not found
 * @deprecated Use UserService instance methods instead
 */
export const getUserWithSessions = (userId: string) =>
  userServiceInstance.getUserWithSessions(userId);

/**
 * Get users with filtering by session expiration
 * @param options Filter options
 * @returns Users with filtered sessions
 * @deprecated Use UserService instance methods instead
 */
export const getUsersWithActiveSessions = (options?: {
  skip?: number;
  take?: number;
  expiresAfter?: Date;
}) => userServiceInstance.getUsersWithActiveSessions(options);

/**
 * Get users with optimized performance using a custom query strategy
 * @param options Query options for pagination and filtering
 * @returns Array of users with session counts
 * @deprecated Use UserService instance methods instead
 */
export const getUsersWithSessionCounts = (options?: { skip?: number; take?: number }) =>
  userServiceInstance.getUsersWithSessionCounts(options);
