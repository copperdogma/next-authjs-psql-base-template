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
  ) {}

  /**
   * Updates a user's name in both the database and Firebase
   */
  async updateUserName(
    userId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Update the name in the database
      await this.userService.updateUserName(userId, name);

      // 2. Get the user to find them in Firebase
      const user = await this.userService.findUserById(userId);

      if (user?.email) {
        try {
          // 3. Find the Firebase user by email
          const firebaseUser = await this.firebaseAdminService.auth().getUserByEmail(user.email);

          // 4. Update the Firebase user's display name
          await this.firebaseAdminService.auth().updateUser(firebaseUser.uid, {
            displayName: name,
          });

          this.logger.info({
            msg: 'Firebase user displayName updated',
            userId,
            firebaseUid: firebaseUser.uid,
          });
        } catch (firebaseError) {
          // Log Firebase error but don't fail the overall operation
          this.logger.error({
            msg: 'Error updating Firebase user displayName',
            error: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
            userId,
          });
          // We continue even if Firebase update fails, as the database is the source of truth
        }
      }

      this.logger.info({ msg: 'User name updated successfully', userId });
      return { success: true };
    } catch (error) {
      this.logger.error({
        msg: 'Error updating user name in database',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return { success: false, error: 'An error occurred while updating your name' };
    }
  }
}
