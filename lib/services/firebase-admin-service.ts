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
//
// This service is designed to be easily testable with the Firebase Admin SDK.
// A static createTestInstance method is provided for mocking during unit tests.
// For integration testing, use the Firebase emulator.
// =============================================================================
import * as admin from 'firebase-admin';
import type * as pino from 'pino';
import type { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';

/**
 * Implementation of FirebaseAdminService using Firebase Admin SDK
 */
export class FirebaseAdminService implements FirebaseAdminServiceInterface {
  private readonly logger: pino.Logger;
  private readonly app: admin.app.App;
  private authInstance: admin.auth.Auth | null = null; // Lazy load Auth instance

  constructor(app: admin.app.App, logger: pino.Logger) {
    this.app = app;
    this.logger = logger;
    this.logger.debug('FirebaseAdminService initialized with injected App');
  }

  /**
   * Check if Firebase Admin SDK is initialized
   */
  isInitialized(): boolean {
    return !!this.app;
  }

  /**
   * Get the Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    return this.auth();
  }

  /**
   * Get the Firebase Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  /**
   * Get the Firebase Storage instance
   */
  getStorage(): admin.storage.Storage {
    return this.app.storage();
  }

  /**
   * Get a user by their Firebase UID
   * @param uid Firebase user ID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.getUserByUid(uid);
  }

  /**
   * Delete a Firebase user
   * @param uid Firebase user ID to delete
   */
  async deleteUser(uid: string): Promise<void> {
    this.logger.debug({ uid }, 'Deleting Firebase user');
    try {
      await this.auth().deleteUser(uid);
      this.logger.info({ uid }, 'Successfully deleted Firebase user');
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), uid },
        'Error deleting Firebase user'
      );
      throw error;
    }
  }

  /**
   * Creates a test instance with mock implementations for unit testing
   * @param mockAuth Optional mock Auth instance
   * @param mockLogger Optional mock logger
   * @returns A FirebaseAdminService instance with mocked dependencies
   */
  static createTestInstance(
    mockAuth?: Partial<admin.auth.Auth>,
    mockLogger?: Partial<pino.Logger>
  ): FirebaseAdminService {
    // Create a mock app
    const mockApp = {
      name: 'mock-app',
      options: {},
    } as admin.app.App;

    // Create a logger that does nothing if not provided
    const logger = (mockLogger || {
      debug: () => {},
      trace: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      child: () => ({ debug: () => {}, trace: () => {} }),
    }) as pino.Logger;

    // Create the service instance
    const service = new FirebaseAdminService(mockApp, logger);

    // Override the auth method to return our mock if provided
    if (mockAuth) {
      service.authInstance = mockAuth as admin.auth.Auth;
    }

    return service;
  }

  /**
   * Gets the Firebase Admin Auth instance, initializing it lazily.
   *
   * @returns {Auth} The Firebase Admin Auth instance.
   */
  auth(): admin.auth.Auth {
    if (!this.authInstance) {
      this.logger.trace('Initializing and getting Firebase Admin Auth instance');
      this.authInstance = admin.auth(this.app);
    }
    return this.authInstance;
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
   * Gets a user by email from Firebase Auth
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth().getUserByEmail(email);
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), email },
        'Error getting Firebase user by email'
      );
      throw error;
    }
  }

  /**
   * Updates a user in Firebase Auth
   * @param uid Firebase user ID
   * @param userData Object containing profile updates (e.g., { displayName: 'New Name' })
   */
  async updateUser(
    uid: string,
    userData: { displayName?: string; photoURL?: string; email?: string }
  ): Promise<admin.auth.UserRecord> {
    try {
      this.logger.debug({ uid, ...userData }, 'Updating Firebase user');
      return await this.auth().updateUser(uid, userData);
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), uid },
        'Error updating Firebase user'
      );
      throw error;
    }
  }

  /**
   * Verifies a Firebase ID token using the Admin SDK.
   *
   * @param {string} idToken The ID token string to verify.
   * @returns {Promise<admin.auth.DecodedIdToken>} A promise that resolves with the decoded ID token.
   * @throws {Error} Throws an error if the token is invalid or verification fails.
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    this.logger.debug('Verifying Firebase ID token');
    try {
      const decodedToken = await this.auth().verifyIdToken(idToken);
      this.logger.trace({ uid: decodedToken.uid }, 'Firebase ID token verified successfully');
      return decodedToken;
    } catch (error) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        'Firebase ID token verification failed'
      );
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Creates a custom token for authentication
   */
  async createCustomToken(uid: string, claims?: Record<string, unknown>) {
    this.logger.debug({ uid, hasClaims: !!claims }, 'Creating custom token');
    return this.auth().createCustomToken(uid, claims);
  }

  /**
   * Creates a new user in Firebase Auth.
   *
   * @param properties The properties for the new user record.
   * @returns A Promise resolving with the newly created UserRecord.
   * @throws Throws an error if the user creation fails.
   */
  async createUser(properties: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    this.logger.info({ email: properties.email }, 'Attempting to create user in Firebase Auth');
    try {
      const userRecord = await this.auth().createUser(properties);
      this.logger.info(
        { uid: userRecord.uid, email: properties.email },
        'Successfully created user in Firebase Auth'
      );
      return userRecord;
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), email: properties.email },
        'Failed to create user in Firebase Auth'
      );
      // Re-throw the error for the caller (e.g., the server action) to handle
      throw error;
    }
  }

  /**
   * Lists users in Firebase Auth with pagination
   */
  async listUsers(
    maxResults: number = 1000,
    pageToken?: string
  ): Promise<admin.auth.ListUsersResult> {
    try {
      return await this.auth().listUsers(maxResults, pageToken);
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), maxResults, pageToken },
        'Error listing Firebase users'
      );
      throw error;
    }
  }

  /**
   * Updates a Firebase user's claims
   * @param uid Firebase user ID
   * @param claims Custom claims object
   */
  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    try {
      await this.auth().setCustomUserClaims(uid, claims);
      this.logger.info({ uid, claims }, 'Firebase custom claims updated');
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error : new Error(String(error)), uid, claims },
        'Error setting Firebase custom claims'
      );
      throw error;
    }
  }
}

// Removed default instance export - will be created centrally
// export const defaultFirebaseAdminService = new FirebaseAdminService();
