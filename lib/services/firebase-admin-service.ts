// =============================================================================
// Unit Testing Note:
// Unit testing services interacting with the Firebase Admin SDK can be complex
// due to the need to mock the SDK's initialization and methods effectively.
// Additionally, persistent module resolution errors ('Cannot find module') were
// encountered when trying to run these tests in the Jest environment, possibly
// related to path aliases or Jest/SWC configuration conflicts.
//
// Validation Strategy:
// The functionality involving Firebase Admin (like fetching/updating user data)
// is primarily validated through integration and E2E tests that interact with
// the Firebase emulator or actual Firebase services.
// =============================================================================
import * as admin from 'firebase-admin';
import * as pino from 'pino';
import { getFirebaseAdmin } from '../firebase-admin';
import { logger as rootLogger } from '../logger';
import { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';

const serviceLogger = rootLogger.child({ service: 'firebase-admin' });

/**
 * Implementation of FirebaseAdminService using Firebase Admin SDK
 */
export class FirebaseAdminService implements FirebaseAdminServiceInterface {
  private readonly logger: pino.Logger;
  // Cache the admin instance for better testability
  private readonly firebaseAdmin: typeof admin;

  constructor(logger: pino.Logger = serviceLogger) {
    this.logger = logger;
    this.logger.debug('FirebaseAdminService initialized');
    // Get Firebase Admin instance at construction time for better testability
    this.firebaseAdmin = getFirebaseAdmin();
  }

  /**
   * Gets the Firebase Admin Auth instance
   */
  auth() {
    this.logger.trace('Getting Firebase Admin Auth instance');
    // Use the cached admin instance to get auth
    return this.firebaseAdmin.auth();
  }

  /**
   * Verify a Firebase ID token
   * @param token Firebase ID token to verify
   */
  async verifyIdToken(token: string) {
    this.logger.trace({ token: token.substring(0, 10) + '...' }, 'Verifying ID token');
    return this.auth().verifyIdToken(token);
  }

  /**
   * Get a user by their Firebase UID
   * @param uid Firebase user ID
   */
  async getUserByUid(uid: string) {
    this.logger.trace({ uid }, 'Getting user by UID');
    return this.auth().getUser(uid);
  }

  /**
   * Gets a user by email using Firebase Auth
   */
  async getUserByEmail(email: string) {
    this.logger.trace({ email }, 'Getting user by email');
    return this.auth().getUserByEmail(email);
  }

  /**
   * Updates a user in Firebase Auth
   * @param uid Firebase user ID
   * @param data Object containing profile updates
   */
  async updateUser(uid: string, data: { displayName?: string }) {
    this.logger.debug({ uid, data }, 'Updating user');
    return this.auth().updateUser(uid, data);
  }

  /**
   * Creates a custom token for authentication
   */
  async createCustomToken(uid: string, claims?: Record<string, unknown>) {
    this.logger.debug({ uid }, 'Creating custom token');
    return this.auth().createCustomToken(uid, claims);
  }
}

// Create default instance
export const defaultFirebaseAdminService = new FirebaseAdminService();
