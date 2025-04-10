'use server';

import { createLogger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const logger = createLogger('profile:actions');

// Define the form state type for the profile form
export type FormState = {
  message: string;
  success: boolean;
};

// Define validation schema for user name
const userNameSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
});

/**
 * Validates the user name using Zod schema
 */
function validateUserName(name: string): { isValid: boolean; error?: string } {
  try {
    userNameSchema.parse({ name });
    return { isValid: true };
  } catch (error) {
    return handleValidationError(error);
  }
}

/**
 * Handles Zod validation errors
 */
function handleValidationError(error: unknown): { isValid: boolean; error: string } {
  // Handle Zod errors
  if (error instanceof z.ZodError) {
    return extractZodErrorMessage(error);
  }

  // Handle other errors
  return { isValid: false, error: 'Invalid name format' };
}

/**
 * Extracts specific error messages from Zod errors
 */
function extractZodErrorMessage(error: z.ZodError): { isValid: boolean; error: string } {
  const issues = error.errors;

  // Check for empty name (too_small) error
  const tooSmallError = issues.find(issue => issue.code === 'too_small' && issue.minimum === 2);
  if (tooSmallError) {
    return { isValid: false, error: 'Name is required' };
  }

  // Check for too long name error
  const tooBigError = issues.find(issue => issue.code === 'too_big' && issue.maximum === 50);
  if (tooBigError) {
    return { isValid: false, error: 'Name is too long (maximum 50 characters)' };
  }

  // Default error message
  const errorMessage = error.errors[0]?.message || 'Invalid name format';
  return { isValid: false, error: errorMessage };
}

/**
 * Verifies the user is authenticated
 */
async function verifyAuthentication(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      logger.warn({ msg: 'User not authenticated' });
      return { isAuthenticated: false, error: 'You must be logged in to update your profile' };
    }

    return { isAuthenticated: true, userId: session.user.id as string };
  } catch (error) {
    logger.error({
      msg: 'Error verifying authentication',
      error: error instanceof Error ? error.message : String(error),
    });
    return { isAuthenticated: false, error: 'Authentication error' };
  }
}

/**
 * Updates the user's display name in the database
 */
async function updateUserNameInDatabase(
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update the name in the Prisma database
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    // 2. Get the user's email to find them in Firebase
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      try {
        // 3. Get Firebase Admin SDK
        const admin = getFirebaseAdmin();

        // 4. Find the Firebase user by email
        const firebaseUser = await admin.auth().getUserByEmail(user.email);

        // 5. Update the Firebase user's display name
        await admin.auth().updateUser(firebaseUser.uid, {
          displayName: name,
        });

        logger.info({
          msg: 'Firebase user displayName updated',
          userId,
          firebaseUid: firebaseUser.uid,
        });
      } catch (firebaseError) {
        // Log Firebase error but don't fail the overall operation
        logger.error({
          msg: 'Error updating Firebase user displayName',
          error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
          userId,
        });
        // We continue even if Firebase update fails, as the database is the source of truth
      }
    }

    logger.info({ msg: 'User name updated successfully', userId });
    return { success: true };
  } catch (error) {
    logger.error({
      msg: 'Error updating user name in database',
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return { success: false, error: 'An error occurred while updating your name' };
  }
}

/**
 * Server action to update the user's display name
 */
export async function updateUserName(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string;
  logger.info({ msg: 'updateUserName called', name });

  // 1. Verify user authentication
  const auth = await verifyAuthentication();
  if (!auth.isAuthenticated || !auth.userId) {
    return {
      message: auth.error || 'You must be logged in to update your profile',
      success: false,
    };
  }

  // 2. Validate the user name
  const validation = validateUserName(name);
  if (!validation.isValid) {
    logger.warn({ msg: 'Invalid user name', name });
    return {
      message: validation.error || 'Invalid name format',
      success: false,
    };
  }

  // 3. Update the user name in the database
  const updateResult = await updateUserNameInDatabase(auth.userId, name);
  if (!updateResult.success) {
    return {
      message: updateResult.error || 'An error occurred while updating your name',
      success: false,
    };
  }

  // 4. Revalidate the profile page to show the updated name
  revalidatePath('/profile');

  logger.info({ msg: 'User name updated successfully', userId: auth.userId });
  return {
    message: 'Name updated successfully',
    success: true,
  };
}
