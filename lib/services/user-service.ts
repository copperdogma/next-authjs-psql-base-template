import { PrismaClient, User } from '@prisma/client';
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
}

// Update default instance export
export const defaultUserService = new UserService();
