import * as admin from 'firebase-admin';
import * as pino from 'pino';
import { getFirebaseAdmin } from '../firebase-admin';
import { logger as rootLogger } from '../logger';

const serviceLogger = rootLogger.child({ service: 'firebase-admin' });

/**
 * Implementation of FirebaseAdminService using Firebase Admin SDK
 */
export class FirebaseAdminService {
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
   * Gets a user by email using Firebase Auth
   */
  async getUserByEmail(email: string) {
    this.logger.trace({ email }, 'Getting user by email');
    return this.auth().getUserByEmail(email);
  }

  /**
   * Updates a user in Firebase Auth
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
