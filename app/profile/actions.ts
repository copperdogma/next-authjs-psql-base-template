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

async function _performNameUpdate(
  userId: string,
  name: string,
  currentLogger: pino.Logger
): Promise<NameUpdateState> {
  if (!profileService) {
    currentLogger.error('Profile service is unavailable.');
    return {
      success: false,
      message: 'Profile service is unavailable.',
      updatedName: null,
    };
  }

  try {
    currentLogger.info({ userId, name }, 'Attempting to update user name via profile service');
    const updateResult = await profileService.updateUserName(userId, name);

    if (!updateResult.success) {
      currentLogger.error(
        { userId, name, error: updateResult.error },
        'Profile service failed to update user name'
      );
      return {
        message: updateResult.error || 'An error occurred while updating your name',
        success: false,
        updatedName: null,
      };
    }

    revalidatePath('/profile');
    revalidatePath('/');
    currentLogger.info({ userId, name }, 'User name updated successfully');
    return {
      message: 'Name updated successfully',
      success: true,
      updatedName: name,
    };
  } catch (error) {
    currentLogger.error({ err: error, userId, name }, 'Unexpected error during user name update');
    const errorMessage =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'An unexpected error occurred.';
    return {
      message: errorMessage,
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
  return _performNameUpdate(userId, name, currentLogger);
}
