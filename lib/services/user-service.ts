import { PrismaClient, User } from '@prisma/client';
import { UserService } from '../interfaces/services';
import { prisma } from '../prisma';

/**
 * Implementation of UserService using Prisma
 */
export class PrismaUserService implements UserService {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  /**
   * Updates a user's name in the database
   */
  async updateUserName(userId: string, name: string): Promise<User> {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  /**
   * Finds a user by their ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.prismaClient.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Finds a user by their email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prismaClient.user.findUnique({
      where: { email },
    });
  }
}

// Create default instance
export const defaultUserService = new PrismaUserService();
