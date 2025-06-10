// =============================================================================
// Unit Testing Note:
// Unit testing Next.js Server Actions, especially those involving database
// interactions and authentication checks, presents significant challenges with
// mocking dependencies (like Prisma, NextAuth sessions) and handling module
// resolution for imports using path aliases (e.g., '@/') within the Jest
// environment. Direct unit tests for 'updateUserName' were skipped due to these
// persistent issues.
//
// Validation Strategy:
// The functionality of this server action is primarily validated through
// End-to-End (E2E) tests (see tests/e2e/profile/edit-profile.spec.ts) which
// simulate user interaction in a browser and verify the profile update flow.
// =============================================================================
'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth'; // Use main auth (Node.js runtime for actions)
import { logger } from '@/lib/logger';
// Import implementation directly and instantiate
import { ProfileServiceImpl } from '@/lib/server/services/profile.service';
import { prisma } from '@/lib/prisma'; // Need prisma to instantiate
import pino from 'pino'; // Import pino
import { ServiceResponse } from '@/types';
import type { User } from '@prisma/client';

// Instantiate the service locally
const profileService = new ProfileServiceImpl(prisma);

// Standardized server action response type using ServiceResponse
export type NameUpdateState = ServiceResponse<
  User | null,
  {
    originalError?: unknown;
    updatedName?: string;
  }
>;

// --- Helper Functions ---

async function _getAuthenticatedUserId(currentLogger: pino.Logger): Promise<string | null> {
  const session = await auth();
  // Ensure userId is explicitly null if undefined from session
  const userId = session?.user?.id ?? null;
  currentLogger.trace({ userId }, 'Retrieved session user ID');
  if (!userId) {
    currentLogger.warn('Attempted action without authentication');
  }
  return userId;
}

function _validateName(
  name: string | null,
  userId: string | null,
  currentLogger: pino.Logger
): { isValid: boolean; message?: string } {
  const trimmedName = name?.trim(); // Trim whitespace

  if (!trimmedName || trimmedName.length < 3) {
    currentLogger.warn({ userId, name }, 'Invalid name submitted (too short or empty)');
    return { isValid: false, message: 'Name must be at least 3 characters long.' };
  }

  // Add max length check
  if (trimmedName.length > 50) {
    currentLogger.warn(
      { userId, nameLength: trimmedName.length },
      'Invalid name submitted (too long)'
    );
    return { isValid: false, message: 'Name cannot exceed 50 characters.' };
  }

  return { isValid: true };
}

/**
 * Performs the actual update of the user's name using the ProfileService
 */
async function _performNameUpdate(
  userId: string,
  newName: string,
  logCtx: Record<string, unknown>
): Promise<NameUpdateState> {
  logger.info(logCtx, 'Attempting to update user name via profile service');

  try {
    if (!profileService) {
      logger.error({ ...logCtx }, 'Profile service is unavailable');
      return {
        status: 'error',
        message: 'Profile service is unavailable',
        error: {
          message: 'Profile service is unavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
      };
    }

    const result = await profileService.updateUserName(userId, newName);

    // Handle the ServiceResponse format from the service
    if (result.status === 'error') {
      logger.error(
        { ...logCtx, error: result.error },
        'Profile service failed to update user name'
      );
      return {
        status: 'error',
        message: result.message || 'An error occurred while updating your name',
        error: {
          message: result.message || 'An error occurred while updating your name',
          code: result.error?.code || 'UPDATE_FAILED',
          details: {
            originalError: result.error?.details?.originalError,
          },
        },
      };
    }

    // If the result is successful, revalidate paths and return the updated user
    revalidatePath('/profile');
    revalidatePath('/');

    return {
      status: 'success',
      message: 'Name updated successfully',
      data: result.data || null,
    };
  } catch (error) {
    logger.error({ ...logCtx, error }, 'Error while updating user name');
    return {
      status: 'error',
      message: 'An unexpected error occurred while updating your name',
      error: {
        message: 'An unexpected error occurred while updating your name',
        code: 'UNEXPECTED_ERROR',
        details: {
          originalError: error,
        },
      },
    };
  }
}

// --- Server Action ---

export async function updateUserName(
  _prevState: NameUpdateState,
  formData: FormData
): Promise<NameUpdateState> {
  const currentLogger = logger.child({ action: 'updateUserName' });
  currentLogger.info('Server Action: updateUserName invoked');

  const userId = await _getAuthenticatedUserId(currentLogger);
  if (!userId) {
    return {
      status: 'error',
      message: 'User not authenticated.',
      error: {
        message: 'User not authenticated.',
        code: 'UNAUTHENTICATED',
      },
    };
  }

  const name = formData.get('name') as string;
  const validation = _validateName(name, userId, currentLogger);
  if (!validation.isValid) {
    return {
      status: 'error',
      message: validation.message || 'Invalid name.',
      error: {
        message: validation.message || 'Invalid name.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  currentLogger.info({ userId, name }, 'Proceeding to _performNameUpdate'); // Diagnostic log
  return _performNameUpdate(userId, name, { userId, name });
}
