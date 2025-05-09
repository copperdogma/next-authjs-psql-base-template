import { prisma, type PrismaClient } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { User } from '@prisma/client';

export interface ProfileServiceInterface {
  updateUserName(
    userId: string,
    newName: string
  ): Promise<{ success: boolean; user?: User; error?: string }>;
}

export class ProfileServiceImpl implements ProfileServiceInterface {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  private _validateName(
    name: string,
    logContext: Record<string, unknown>
  ): {
    isValid: boolean;
    errorMessage?: string;
    processedName?: string;
  } {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 50) {
      logger.warn({
        ...logContext,
        validationError: 'Name length constraints not met.',
        originalName: name,
        trimmedName,
      });
      return {
        isValid: false,
        errorMessage: 'Name must be between 3 and 50 characters.',
      };
    }
    return { isValid: true, processedName: trimmedName };
  }

  // Simplified error parsing, can be expanded for specific DB errors
  private _parseDbError(error: unknown): {
    errorCode?: string;
    message: string;
    stack?: string;
    originalError: unknown;
  } {
    let errorCode: string | undefined;
    let message: string = 'An unexpected database error occurred.';
    let stack: string | undefined;

    if (typeof error === 'object' && error !== null) {
      const errObj = error as {
        code?: unknown;
        message?: unknown;
        stack?: unknown;
        meta?: unknown;
      };
      if (typeof errObj.code === 'string') {
        // For Prisma errors, code is like P2025
        errorCode = errObj.code;
      }
      if (typeof errObj.message === 'string') {
        message = errObj.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (error instanceof Error) {
        stack = error.stack;
      }
    } else {
      message = String(error);
    }
    return { errorCode, message, stack, originalError: error };
  }

  async updateUserName(
    userId: string,
    newName: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const logContext = { userId, newName, service: 'ProfileService', method: 'updateUserName' };
    logger.info(logContext, 'Attempting to update user name.');

    const nameValidation = this._validateName(newName, logContext);
    if (!nameValidation.isValid || typeof nameValidation.processedName !== 'string') {
      return { success: false, error: nameValidation.errorMessage || 'Invalid name processed.' };
    }
    const processedName = nameValidation.processedName;

    try {
      const updatedUser = await this.db.user.update({
        where: { id: userId },
        data: { name: processedName }, // Use validated and trimmed name
      });
      logger.info(
        { ...logContext, dbUserId: updatedUser.id },
        'Successfully updated user name in database.'
      );
      return { success: true, user: updatedUser };
    } catch (error: unknown) {
      const parsedError = this._parseDbError(error);
      logger.error(
        {
          ...logContext,
          errorMessage: parsedError.message,
          errorCode: parsedError.errorCode,
          errorStack: parsedError.stack,
          rawError: parsedError.originalError,
        },
        'Error updating user name in database.'
      );

      if (parsedError.errorCode === 'P2025') {
        // Prisma code for Record to update not found
        return { success: false, error: 'User not found.' };
      }
      return { success: false, error: parsedError.message || 'Could not update user name.' };
    }
  }
}
