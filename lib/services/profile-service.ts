import * as pino from 'pino';
import { UserService } from './user-service';
import { FirebaseAdminService } from './firebase-admin-service';
import { logger as rootLogger } from '../logger';

// Create a logger specific to this service
const serviceLogger = rootLogger.child({ service: 'profile' });

/**
 * ProfileService handles profile-related operations
 */
export class ProfileService {
  constructor(
    private readonly userService: UserService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly logger: pino.Logger = serviceLogger
  ) {
    if (!userService) {
      const errorMsg = 'UserService dependency is required for ProfileService.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (!firebaseAdminService) {
      const errorMsg = 'FirebaseAdminService dependency is required for ProfileService.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Try to update a user's display name in Firebase if possible
   * @private
   */
  private async tryUpdateFirebaseUserName(
    userEmail: string,
    name: string,
    userId: string
  ): Promise<void> {
    try {
      // Try to find the user in Firebase
      const firebaseUser = await this.firebaseAdminService.getUserByEmail(userEmail);

      if (firebaseUser) {
        // Update Firebase user display name
        await this.firebaseAdminService.updateUser(firebaseUser.uid, { displayName: name });
        this.logger.info(
          { userId, firebaseUid: firebaseUser.uid },
          'Firebase user displayName updated'
        );
      }
    } catch (firebaseError: unknown) {
      // Log but don't fail if Firebase update fails
      this.logger.warn(
        {
          userId,
          error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
        },
        'Could not update Firebase user - continuing'
      );
    }
  }

  /**
   * Updates a user's display name in both the database and Firebase Auth (if available)
   */
  async updateUserName(
    userId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update in database
      await this.userService.updateUserName(userId, name);

      // If user has email, also update in Firebase
      const user = await this.userService.findUserById(userId);

      if (!user || !user.email) {
        this.logger.info({ userId }, 'User name updated successfully (no Firebase update needed)');
        return { success: true };
      }

      // Try Firebase update separately
      await this.tryUpdateFirebaseUserName(user.email, name, userId);

      this.logger.info({ userId }, 'User name updated successfully');
      return { success: true };
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Error updating user name in database',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
