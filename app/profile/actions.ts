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

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as pino from 'pino';
import { logger as rootLogger } from '@/lib/logger';
import { ProfileService } from '@/lib/services/profile-service';
import { profileService as singletonProfileService } from '@/lib/server/services';
import { auth } from '@/lib/auth-node';

const actionsLogger = rootLogger.child({ service: 'profile-actions' });

// Define the form state type for the profile form
export type UpdateUserNameFormState = {
  message: string;
  success: boolean;
  updatedName?: string | null; // Add optional field for the updated name
};

// --- Private Helper Functions (Extracted from Class) ---

// Define validation schema for user name
const userNameSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
});

/**
 * Extracts specific error messages from Zod errors
 */
function _extractZodErrorMessage(error: z.ZodError): { isValid: boolean; error: string } {
  const issues = error.errors;
  const tooSmallError = issues.find(issue => issue.code === 'too_small' && issue.minimum === 2);
  if (tooSmallError) {
    return { isValid: false, error: 'Name is required' };
  }
  const tooBigError = issues.find(issue => issue.code === 'too_big' && issue.maximum === 50);
  if (tooBigError) {
    return { isValid: false, error: 'Name is too long (maximum 50 characters)' };
  }
  const errorMessage = error.errors[0]?.message || 'Invalid name format';
  return { isValid: false, error: errorMessage };
}

/**
 * Handles Zod validation errors
 */
function _handleValidationError(error: unknown): { isValid: boolean; error: string } {
  if (error instanceof z.ZodError) {
    return _extractZodErrorMessage(error);
  }
  return { isValid: false, error: 'Invalid name format' };
}

/**
 * Validates the user name using Zod schema
 */
function _validateUserName(name: string): { isValid: boolean; error?: string } {
  try {
    userNameSchema.parse({ name });
    return { isValid: true };
  } catch (error) {
    return _handleValidationError(error);
  }
}

/**
 * Verifies the user is authenticated
 */
async function _verifyAuthentication(loggerInstance: pino.Logger): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}> {
  let session;
  try {
    loggerInstance.debug('verifyAuthentication - Checking auth session');
    session = await auth();
    loggerInstance.debug('verifyAuthentication - Auth session retrieved');

    if (session?.user?.id) {
      loggerInstance.debug({ msg: 'User authenticated', userId: session.user.id });
      return { isAuthenticated: true, userId: session.user.id };
    }

    loggerInstance.warn({
      msg: 'User not authenticated in verifyAuthentication',
      sessionExists: !!session,
      userExists: !!session?.user,
      idExists: !!session?.user?.id,
    });
    return {
      isAuthenticated: false,
      error: 'You must be logged in to update your profile',
    };
  } catch (error) {
    loggerInstance.error({ err: error }, 'Error during authentication verification');
    return { isAuthenticated: false, error: 'Authentication check failed' };
  }
}

/**
 * Server action to update the user's display name.
 * Dependencies can be injected for testing.
 */
// eslint-disable-next-line max-statements -- Statement count is minimally high due to necessary auth/validation checks and service calls.
export async function updateUserName(
  _prevState: UpdateUserNameFormState, // Use the new type
  formData: FormData,
  // Optional dependencies for testing
  injectedProfileService?: ProfileService,
  injectedLogger?: pino.Logger
): Promise<UpdateUserNameFormState> {
  // Return the new type
  // Use injected dependencies or fall back to defaults
  const currentProfileService = injectedProfileService || singletonProfileService;
  const currentLogger = injectedLogger || actionsLogger;

  const name = formData.get('name') as string;
  currentLogger.info({ msg: 'updateUserName called', name });

  // 1. Verify user authentication
  const authResult = await _verifyAuthentication(currentLogger);
  if (!authResult.isAuthenticated || !authResult.userId) {
    return {
      message: authResult.error || 'You must be logged in to update your profile',
      success: false,
      updatedName: null,
    };
  }
  const userId = authResult.userId;

  // 2. Validate the user name
  const validation = _validateUserName(name);
  if (!validation.isValid) {
    currentLogger.warn({ msg: 'Invalid user name', name });
    return {
      message: validation.error || 'Invalid name format',
      success: false,
      updatedName: null,
    };
  }

  // 3. Update the user name using the ProfileService
  const updateResult = await currentProfileService.updateUserName(userId, name);
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

  // 4. Revalidate paths
  revalidatePath('/profile');
  revalidatePath('/');

  currentLogger.info({ msg: 'User name updated successfully', userId: userId });
  return {
    message: 'Name updated successfully',
    success: true,
    updatedName: name, // Include the updated name on success
  };
}
