// =============================================================================
// DEPRECATED: This file is deprecated and will be removed in a future version.
// Please use the consolidated UserService from lib/services/user-service.ts instead,
// which includes all functionality from this file plus additional error handling.
// =============================================================================

// =============================================================================
// Unit Testing Note:
// Unit testing database interactions, especially involving Prisma in Jest,
// can face significant environment and mocking challenges (e.g., PrismaClient
// initialization errors). Tests specifically targeting patterns like N+1 query
// prevention for methods in this service were skipped due to these issues.
//
// Validation Strategy:
// Database interaction logic, including query efficiency, is primarily validated
// through integration tests and potentially query monitoring during E2E tests
// rather than isolated unit tests.
// =============================================================================
import { prisma } from '../prisma';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * User service with optimized database query patterns
 * @deprecated Use UserService from lib/services/user-service.ts instead
 */
export class UserService {
  private prisma: PrismaClient;

  /**
   * Initialize user service with optional PrismaClient instance
   * @param prismaClient Optional PrismaClient instance (defaults to global instance)
   * @deprecated Use UserService from lib/services/user-service.ts instead
   */
  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Get all users with their sessions efficiently (prevents N+1 query problem)
   * @param options Optional query options
   * @returns Array of users with their sessions
   * @deprecated Use UserService.getUsersWithSessions from lib/services/user-service.ts instead
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
   * @deprecated Use UserService.getUserWithSessions from lib/services/user-service.ts instead
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
   * @deprecated Use UserService.getUsersWithActiveSessions from lib/services/user-service.ts instead
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
   * @deprecated Use UserService.getUsersWithSessionCounts from lib/services/user-service.ts instead
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

  /**
   * Finds a user based on the provider and provider account ID.
   *
   * @param provider The OAuth provider name (e.g., 'google')
   * @param providerAccountId The user's unique ID for that provider
   * @returns The user associated with the account, or null if not found.
   * @deprecated Use UserService.getUserByAccount from lib/services/user-service.ts instead
   */
  async getUserByAccount(provider: string, providerAccountId: string) {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: { user: true }, // Include the user data associated with the account
    });

    // Return the user object if the account and associated user exist
    return account?.user ?? null;
  }
}

/**
 * Create a default instance for backward compatibility
 * @deprecated Use defaultUserService from lib/services/user-service.ts instead
 */
export const userServiceInstance = new UserService();
