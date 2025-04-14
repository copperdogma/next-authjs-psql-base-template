import { PrismaClient, User } from '@prisma/client';
import { prisma } from '../prisma';
import * as pino from 'pino';
import { logger as rootLogger } from '../logger';

const serviceLogger = rootLogger.child({ service: 'user' });

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
   */
  async updateUserName(userId: string, name: string): Promise<User> {
    this.logger.info({ msg: 'Updating user name', userId });
    try {
      const user = await this.prismaClient.user.update({
        where: { id: userId },
        data: { name },
      });
      this.logger.info({ msg: 'User name updated successfully', userId });
      return user;
    } catch (error) {
      this.logger.error({
        msg: 'Error updating user name',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error; // Re-throw the error after logging
    }
  }

  /**
   * Finds a user by their ID
   */
  async findUserById(userId: string): Promise<User | null> {
    this.logger.debug({ msg: 'Finding user by ID', userId });
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });
      this.logger.debug({ msg: 'User found by ID', userId, found: !!user });
      return user;
    } catch (error) {
      this.logger.error({
        msg: 'Error finding user by ID',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Finds a user by their email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.debug({ msg: 'Finding user by email', email });
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { email },
      });
      this.logger.debug({ msg: 'User found by email', email, found: !!user });
      return user;
    } catch (error) {
      this.logger.error({
        msg: 'Error finding user by email',
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw error;
    }
  }
}

// Update default instance export
export const defaultUserService = new UserService();
