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

// Instantiate the service locally
const profileService = new ProfileServiceImpl(prisma);

export type NameUpdateState = {
  message: string;
  success: boolean;
  updatedName: string | null;
};

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
): Promise<{ success: boolean; message: string; updatedName: string | null }> {
  logger.info(logCtx, 'Attempting to update user name via profile service');

  try {
    if (!profileService) {
      logger.error({ ...logCtx }, 'Profile service is unavailable');
      return {
        message: 'Profile service is unavailable',
        success: false,
        updatedName: null,
      };
    }

    const result = await profileService.updateUserName(userId, newName);

    // Handle the new ServiceResponse format with status field
    if (result.status === 'error') {
      logger.error(
        { ...logCtx, error: result.error },
        'Profile service failed to update user name'
      );
      return {
        message: result.message || 'An error occurred while updating your name',
        success: false,
        updatedName: null,
      };
    }

    // If the result is successful, revalidate paths and return the updated name
    revalidatePath('/profile');
    revalidatePath('/');

    return {
      message: 'Name updated successfully',
      success: true,
      updatedName: newName,
    };
  } catch (error) {
    logger.error({ ...logCtx, error }, 'Error while updating user name');
    return {
      message: 'An unexpected error occurred while updating your name',
      success: false,
      updatedName: null,
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
    return { success: false, message: 'User not authenticated.', updatedName: null };
  }

  const name = formData.get('name') as string;
  const validation = _validateName(name, userId, currentLogger);
  if (!validation.isValid) {
    return { success: false, message: validation.message || 'Invalid name.', updatedName: null };
  }

  currentLogger.info({ userId, name }, 'Proceeding to _performNameUpdate'); // Diagnostic log
  return _performNameUpdate(userId, name, { userId, name });
}
