import * as pino from 'pino';
import { PrismaClient, User } from '@prisma/client';
import { logger as rootLogger } from '../logger';
import { ServiceResponse } from '@/types';

// Create a logger specific to this service
const serviceLogger = rootLogger.child({ service: 'profile' });

/**
 * ProfileService handles profile-related operations directly with Prisma.
 */
export class ProfileService {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly logger: pino.Logger = serviceLogger
  ) {
    if (!prismaClient) {
      const errorMsg = 'PrismaClient dependency is required for ProfileService.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Updates a user's display name in the database.
   */
  async updateUserName(
    userId: string,
    name: string
  ): Promise<ServiceResponse<User, { originalError?: unknown }>> {
    const logContext = { userId, newName: name, function: 'updateUserName' };
    this.logger.debug(logContext, 'Attempting to update user name in DB');

    if (!userId) {
      this.logger.warn(logContext, 'Attempted to update user name with an empty user ID.');
      return {
        status: 'error',
        message: 'User ID validation failed.',
        error: {
          message: 'User ID cannot be empty.',
          code: 'VALIDATION_ERROR',
        },
      };
    }
    if (!name) {
      this.logger.warn(logContext, 'Attempted to update user name with an empty string.');
      return {
        status: 'error',
        message: 'Name validation failed.',
        error: {
          message: 'New name cannot be empty.',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    try {
      const updatedUser = await this.prismaClient.user.update({
        where: { id: userId },
        data: { name },
      });

      this.logger.info(logContext, 'User name updated successfully in DB.');
      return {
        status: 'success',
        data: updatedUser,
        message: 'User name updated successfully.',
      };
    } catch (error: unknown) {
      this.logger.error({ ...logContext, error }, 'Failed to update user name in database.');
      return {
        status: 'error',
        message: 'Failed to update user name in database.',
        error: {
          message: 'A database error occurred while updating the user name.',
          code: 'DB_UPDATE_FAILED',
          details: { originalError: error },
        },
      };
    }
  }

  /**
   * Fetches a user's profile from the database.
   */
  async getUserProfile(
    userId: string
  ): Promise<ServiceResponse<User, { originalError?: unknown }>> {
    const logContext = { userId, function: 'getUserProfile' };
    this.logger.debug(logContext, 'Attempting to fetch user profile from DB');

    if (!userId) {
      this.logger.warn(logContext, 'Attempted to fetch user profile with an empty user ID.');
      return {
        status: 'error',
        message: 'User ID validation failed.',
        error: {
          message: 'User ID cannot be empty.',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    try {
      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(logContext, 'User profile not found.');
        return {
          status: 'error',
          message: 'User profile not found.',
          error: {
            message: 'No user found with the provided ID.',
            code: 'USER_NOT_FOUND',
          },
        };
      }

      this.logger.info(logContext, 'User profile fetched successfully.');
      return {
        status: 'success',
        data: user,
        message: 'User profile fetched successfully.',
      };
    } catch (error: unknown) {
      this.logger.error({ ...logContext, error }, 'Failed to fetch user profile from database.');
      return {
        status: 'error',
        message: 'Failed to fetch user profile from database.',
        error: {
          message: 'A database error occurred while fetching the user profile.',
          code: 'DB_FETCH_FAILED',
          details: { originalError: error },
        },
      };
    }
  }
}
