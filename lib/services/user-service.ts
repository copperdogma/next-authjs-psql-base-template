import { PrismaClient, User, Prisma, Session } from '@prisma/client';
import { prisma } from '../prisma';
import * as pino from 'pino';
import { logger as rootLogger } from '../logger';
import { ServiceResponse } from '@/types';

const serviceLogger = rootLogger.child({ service: 'user' });

type UserServiceErrorDetails = {
  originalError?: unknown;
};

/**
 * Implementation of UserService using Prisma
 */
export class UserService {
  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly logger: pino.Logger = serviceLogger
  ) {}

  /**
   * Updates a user's name in the database
   * @param userId The ID of the user to update
   * @param name The new name for the user
   * @returns A ServiceResponse containing the updated user or error details
   */
  async updateUserName(
    userId: string,
    name: string
  ): Promise<ServiceResponse<User, UserServiceErrorDetails>> {
    this.logger.info({ msg: 'Updating user name', userId });
    try {
      const user = await this.prismaClient.user.update({
        where: { id: userId },
        data: { name },
      });
      this.logger.info({ msg: 'User name updated successfully', userId });
      return {
        status: 'success',
        data: user,
        message: 'User name updated successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error updating user name',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });

      // Handle specific Prisma error for record not found
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return {
          status: 'error',
          message: 'User not found.',
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found.',
            details: { originalError: error },
          },
        };
      }

      return {
        status: 'error',
        message: 'Failed to update user name.',
        error: {
          code: 'DB_UPDATE_FAILED',
          message: 'Database error occurred while updating user name.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Finds a user by their ID
   * @param userId The ID of the user to find
   * @returns A ServiceResponse containing the user if found or error details
   */
  async findUserById(
    userId: string
  ): Promise<ServiceResponse<User | null, UserServiceErrorDetails>> {
    this.logger.debug({ msg: 'Finding user by ID', userId });
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });

      this.logger.debug({ msg: 'User found by ID', userId, found: !!user });

      if (!user) {
        return {
          status: 'error',
          message: 'User not found.',
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found.',
          },
        };
      }

      return {
        status: 'success',
        data: user,
        message: 'User fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error finding user by ID',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });

      return {
        status: 'error',
        message: 'Failed to fetch user.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching user.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Finds a user by their email
   * @param email The email of the user to find
   * @returns A ServiceResponse containing the user if found or error details
   */
  async findUserByEmail(
    email: string
  ): Promise<ServiceResponse<User | null, UserServiceErrorDetails>> {
    this.logger.debug({ msg: 'Finding user by email', email });
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { email },
      });

      this.logger.debug({ msg: 'User found by email', email, found: !!user });

      if (!user) {
        return {
          status: 'error',
          message: 'User not found.',
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found.',
          },
        };
      }

      return {
        status: 'success',
        data: user,
        message: 'User fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error finding user by email',
        error: error instanceof Error ? error.message : String(error),
        email,
      });

      return {
        status: 'error',
        message: 'Failed to fetch user.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching user.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Get all users with their sessions efficiently (prevents N+1 query problem)
   * @param options Optional query options
   * @returns ServiceResponse containing array of users with their sessions
   */
  async getUsersWithSessions(options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }): Promise<ServiceResponse<(User & { sessions: Session[] })[], UserServiceErrorDetails>> {
    this.logger.debug({ msg: 'Getting users with sessions', options });
    try {
      const users = await this.prismaClient.user.findMany({
        ...options,
        // Include sessions in a single query to prevent N+1 problem
        include: {
          sessions: true,
        },
      });

      this.logger.debug({ msg: 'Retrieved users with sessions', count: users.length });

      return {
        status: 'success',
        data: users,
        message: 'Users with sessions fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error getting users with sessions',
        error: error instanceof Error ? error.message : String(error),
        options,
      });

      return {
        status: 'error',
        message: 'Failed to fetch users with sessions.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching users with sessions.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Get a single user with their sessions
   * @param userId The user ID to find
   * @returns ServiceResponse containing user with sessions or null if not found
   */
  async getUserWithSessions(
    userId: string
  ): Promise<ServiceResponse<(User & { sessions: Session[] }) | null, UserServiceErrorDetails>> {
    this.logger.debug({ msg: 'Getting user with sessions', userId });
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          sessions: true,
        },
      });

      this.logger.debug({
        msg: 'Retrieved user with sessions',
        userId,
        found: !!user,
        sessionCount: user?.sessions.length ?? 0,
      });

      if (!user) {
        return {
          status: 'error',
          message: 'User not found.',
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found.',
          },
        };
      }

      return {
        status: 'success',
        data: user,
        message: 'User with sessions fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error getting user with sessions',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });

      return {
        status: 'error',
        message: 'Failed to fetch user with sessions.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching user with sessions.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Get users with filtering by session expiration
   * Shows advanced filtering pattern to avoid N+1 while applying constraints
   * @param options Filter options
   * @returns ServiceResponse containing users with filtered sessions
   */
  async getUsersWithActiveSessions(options?: {
    skip?: number;
    take?: number;
    expiresAfter?: Date;
  }): Promise<ServiceResponse<(User & { sessions: Session[] })[], UserServiceErrorDetails>> {
    const { expiresAfter = new Date(), skip, take } = options || {};

    this.logger.debug({
      msg: 'Getting users with active sessions',
      expiresAfter,
      skip,
      take,
    });

    try {
      const users = await this.prismaClient.user.findMany({
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

      this.logger.debug({
        msg: 'Retrieved users with active sessions',
        count: users.length,
      });

      return {
        status: 'success',
        data: users,
        message: 'Users with active sessions fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error getting users with active sessions',
        error: error instanceof Error ? error.message : String(error),
        options,
      });

      return {
        status: 'error',
        message: 'Failed to fetch users with active sessions.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching users with active sessions.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Get users with optimized performance using a custom query strategy
   * @param options Query options for pagination and filtering
   * @returns ServiceResponse containing array of users with session counts
   */
  async getUsersWithSessionCounts(options?: { skip?: number; take?: number }): Promise<
    ServiceResponse<
      Array<
        Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> & {
          _count: { sessions: number };
        }
      >,
      UserServiceErrorDetails
    >
  > {
    const { skip, take } = options || {};

    this.logger.debug({
      msg: 'Getting users with session counts',
      skip,
      take,
    });

    try {
      // Using Prisma's count in select for performance
      const users = await this.prismaClient.user.findMany({
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

      this.logger.debug({
        msg: 'Retrieved users with session counts',
        count: users.length,
      });

      return {
        status: 'success',
        data: users,
        message: 'Users with session counts fetched successfully.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error getting users with session counts',
        error: error instanceof Error ? error.message : String(error),
        options,
      });

      return {
        status: 'error',
        message: 'Failed to fetch users with session counts.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching users with session counts.',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Finds a user based on the provider and provider account ID.
   *
   * @param provider The OAuth provider name (e.g., 'google')
   * @param providerAccountId The user's unique ID for that provider
   * @returns ServiceResponse containing the user associated with the account, or null if not found.
   */
  async getUserByAccount(
    provider: string,
    providerAccountId: string
  ): Promise<ServiceResponse<User | null, UserServiceErrorDetails>> {
    this.logger.debug({
      msg: 'Finding user by account',
      provider,
      providerAccountId,
    });

    try {
      const account = await this.prismaClient.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true }, // Include the user data associated with the account
      });

      const user = account?.user ?? null;

      this.logger.debug({
        msg: 'User found by account',
        provider,
        providerAccountId,
        found: !!user,
      });

      if (!user) {
        return {
          status: 'error',
          message: 'User not found for the specified account.',
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found for the specified account.',
          },
        };
      }

      return {
        status: 'success',
        data: user,
        message: 'User fetched successfully by account.',
      };
    } catch (error) {
      this.logger.error({
        msg: 'Error finding user by account',
        error: error instanceof Error ? error.message : String(error),
        provider,
        providerAccountId,
      });

      return {
        status: 'error',
        message: 'Failed to fetch user by account.',
        error: {
          code: 'DB_FETCH_FAILED',
          message: 'Database error occurred while fetching user by account.',
          details: { originalError: error },
        },
      };
    }
  }
}

// Update default instance export
export const defaultUserService = new UserService();
