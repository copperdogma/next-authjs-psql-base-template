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
import pino from 'pino';
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin';

// Minimal options, can be expanded later if needed
// interface FirebaseServiceOptions { // Removed unused interface
//   someOption?: string;
// }

/**
 * Implementation of FirebaseAdminService using Firebase Admin SDK
 */
export class FirebaseAdminService {
  private static readonly SERVICE_NAME = 'FirebaseAdminService';
  private static instance: FirebaseAdminService | null = null;
  private static instanceLock = false; // Lock to prevent simultaneous initializations

  private logger: pino.Logger;
  private app: admin.app.App;
  private authInstance: admin.auth.Auth;
  private isSdkInitialized = false;

  // Private constructor for singleton pattern
  private constructor(appInstance: admin.app.App, loggerInstance: pino.Logger) {
    this.app = appInstance;
    this.logger = loggerInstance.child({ serviceName: FirebaseAdminService.SERVICE_NAME });
    this.authInstance = this.app.auth();
    this.isSdkInitialized = true;
    this.logger.info('FirebaseAdminService initialized via constructor');
  }

  // Standard getInstance method
  public static getInstance(logger: pino.Logger): FirebaseAdminService {
    // First check: quick return if instance already exists
    if (FirebaseAdminService.instance) {
      logger.debug(
        'FirebaseAdminService returning existing instance via getInstance (early return)'
      );
      return FirebaseAdminService.instance;
    }

    // If we're already in the process of creating an instance, wait
    if (FirebaseAdminService.instanceLock) {
      logger.debug('FirebaseAdminService initialization in progress, waiting...');
      // Simple blocking wait - better would be to use a promise-based approach
      while (FirebaseAdminService.instanceLock) {
        // Micro-wait
      }

      // After waiting, check if instance now exists
      if (FirebaseAdminService.instance) {
        logger.debug('FirebaseAdminService returning instance created during wait');
        return FirebaseAdminService.instance;
      }
    }

    // Set lock to prevent multiple simultaneous initializations
    FirebaseAdminService.instanceLock = true;

    try {
      // Double-check pattern - verify again after acquiring lock
      if (!FirebaseAdminService.instance) {
        const app = getFirebaseAdminApp(); // Ensure app is initialized via singleton
        if (!app) {
          // This is a critical failure if the app is not available when getInstance is called.
          logger.error(
            '[FirebaseAdminService.getInstance] Firebase Admin App is not available via getFirebaseAdminApp(). Cannot create service instance.'
          );
          // Throw to make the issue very clear.
          throw new Error(
            'FirebaseAdminService.getInstance: Firebase Admin App not initialized or available. Check earlier logs.'
          );
        }

        FirebaseAdminService.instance = new FirebaseAdminService(app, logger);
        logger.info('FirebaseAdminService new instance created via getInstance');
      }
    } finally {
      // Always release the lock regardless of success or failure
      FirebaseAdminService.instanceLock = false;
    }

    return FirebaseAdminService.instance as FirebaseAdminService;
  }

  // Factory method for creating instances, especially for tests with mocked dependencies
  public static createTestInstance(
    mockAuthInstance: admin.auth.Auth,
    loggerInstance: pino.Logger,
    mockAppInstance?: admin.app.App // Optional mock app
  ): FirebaseAdminService {
    const appToUse =
      mockAppInstance ||
      ({
        auth: () => mockAuthInstance,
        name: 'mock-app',
        // other necessary app properties if any
      } as admin.app.App);

    // Directly use the constructor, ensuring all required params are met
    // This bypasses the singleton logic of getInstance for isolated testing
    const serviceInstance = new FirebaseAdminService(appToUse, loggerInstance);
    // Explicitly set the authInstance to the mock one, as appToUse.auth() might not be fully mocked
    serviceInstance.authInstance = mockAuthInstance;
    serviceInstance.isSdkInitialized = true; // Assume initialized for test purposes
    serviceInstance.logger.info('FirebaseAdminService test instance created');
    return serviceInstance;
  }

  // Public methods accessing this.authInstance and this.logger
  public isInitialized(): boolean {
    return this.isSdkInitialized;
  }

  public getAuth(): admin.auth.Auth {
    if (!this.authInstance) {
      this.logger.error('Auth instance not initialized!');
      throw new Error('FirebaseAdminService: Auth instance not available.');
    }
    return this.authInstance;
  }

  async createUser(props: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().createUser(props);
      this.logger.info(
        { uid: userRecord.uid, email: props.email },
        'Successfully created user in Firebase Auth'
      );
      return userRecord;
    } catch (error) {
      this.logger.error(
        { err: error, email: props.email },
        'Failed to create user in Firebase Auth'
      );
      throw error;
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().getUser(uid);
      return userRecord;
    } catch (error) {
      this.logger.error({ err: error, uid }, 'Error getting Firebase user');
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      this.logger.error({ err: error, email }, 'Error getting Firebase user by email');
      throw error;
    }
  }

  async listUsers(maxResults?: number, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    try {
      const listUsersResult = await this.getAuth().listUsers(maxResults, pageToken);
      return listUsersResult;
    } catch (error) {
      this.logger.error({ err: error }, 'Error listing Firebase users');
      throw error;
    }
  }

  async setCustomClaims(uid: string, claims: object | null): Promise<void> {
    try {
      await this.getAuth().setCustomUserClaims(uid, claims);
      this.logger.info({ uid, claims }, 'Successfully set custom claims for user');
    } catch (error) {
      this.logger.error({ err: error, uid, claims }, 'Error setting Firebase custom claims');
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.getAuth().deleteUser(uid);
      this.logger.info({ uid }, 'Successfully deleted Firebase user');
    } catch (error) {
      this.logger.error({ err: error, uid }, 'Error deleting Firebase user');
      throw error;
    }
  }

  async updateUser(uid: string, props: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().updateUser(uid, props);
      this.logger.info({ uid, props }, 'Successfully updated Firebase user');
      return userRecord;
    } catch (error) {
      this.logger.error({ err: error, uid, props }, 'Error updating Firebase user');
      throw error;
    }
  }

  async verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.getAuth().verifyIdToken(idToken, checkRevoked);
      return decodedToken;
    } catch (error) {
      this.logger.error({ err: error }, 'Firebase ID token verification failed');
      throw error;
    }
  }

  async createCustomToken(uid: string, developerClaims?: object): Promise<string> {
    try {
      const customToken = await this.getAuth().createCustomToken(uid, developerClaims);
      return customToken;
    } catch (error) {
      this.logger.error({ err: error, uid }, 'Error creating Firebase custom token');
      throw error;
    }
  }

  async createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string> {
    try {
      const sessionCookie = await this.getAuth().createSessionCookie(idToken, options);
      this.logger.info(
        {
          uid: (await this.verifyIdToken(idToken)).uid,
          expiresInSeconds: options.expiresIn / 1000,
        },
        'Successfully created Firebase session cookie'
      );
      return sessionCookie;
    } catch (error) {
      this.logger.error({ err: error }, 'Error creating Firebase session cookie');
      throw error;
    }
  }
}

// Removed default instance export - will be created centrally
// export const defaultFirebaseAdminService = new FirebaseAdminService();
