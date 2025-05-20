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

// Error handling and retry constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

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
  // eslint-disable-next-line max-statements -- Singleton with locking has inherent statement count
  public static getInstance(logger: pino.Logger): FirebaseAdminService {
    if (FirebaseAdminService.instance) {
      return FirebaseAdminService.instance;
    }

    if (FirebaseAdminService.instanceLock) {
      while (FirebaseAdminService.instanceLock); // Busy wait for lock release

      if (FirebaseAdminService.instance) {
        return FirebaseAdminService.instance;
      }
    }

    FirebaseAdminService.instanceLock = true;

    try {
      if (!FirebaseAdminService.instance) {
        const app = getFirebaseAdminApp();
        if (!app) {
          logger.error(
            '[FirebaseAdminService.getInstance] Firebase Admin App is not available via getFirebaseAdminApp(). Cannot create service instance.'
          );
          throw new Error(
            'FirebaseAdminService.getInstance: Firebase Admin App not initialized or available. Check earlier logs.'
          );
        }
        FirebaseAdminService.instance = new FirebaseAdminService(app, logger);
        logger.info('FirebaseAdminService new instance created via getInstance');
      }
    } finally {
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

  /**
   * Determines if an error is retryable based on its message
   * @param error The error to check
   * @returns boolean indicating if the error should be retried
   */
  private isRetryableError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      errorMessage.includes('network') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('ECONNREFUSED')
    );
  }

  /**
   * Utility method to handle potential Firebase Admin connection issues
   * with retry logic and improved error reporting
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    let lastError: Error | unknown;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        // If not the first attempt, wait before retrying
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retryCount));
          /* this.logger.info(
            { operationName, retryCount, ...context },
            `Retrying Firebase Admin operation (attempt ${retryCount + 1}/${MAX_RETRIES})`
          ); */ // Log removed
        }

        return await operation();
      } catch (error) {
        lastError = error;
        retryCount++;

        // Log the error, but don't rethrow yet if we have retries left
        this.logger.warn(
          { err: error, operationName, retryCount, ...context },
          `Firebase Admin operation failed, ${retryCount < MAX_RETRIES ? 'will retry' : 'max retries reached'}`
        );

        // Check if the error is retryable
        if (!this.isRetryableError(error)) {
          /* this.logger.info(
            { operationName, errorMessage: error instanceof Error ? error.message : String(error) },
            'Error not deemed retryable, will not attempt further retries'
          ); */ // Log removed
          break; // Don't retry non-connection errors
        }
      }
    }

    // If we get here, all retries failed
    this.logger.error(
      { err: lastError, operationName, ...context },
      `Firebase Admin operation failed after ${MAX_RETRIES} retries`
    );

    throw lastError;
  }

  public getAuth(): admin.auth.Auth {
    if (!this.authInstance) {
      this.logger.error('Auth instance not initialized!');
      throw new Error('FirebaseAdminService: Auth instance not available.');
    }
    return this.authInstance;
  }

  async createUser(props: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    return this.withRetry(
      async () => {
        const userRecord = await this.getAuth().createUser(props);
        this.logger.info(
          { uid: userRecord.uid, email: props.email },
          'Successfully created user in Firebase Auth'
        );
        return userRecord;
      },
      'createUser',
      { email: props.email }
    );
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.withRetry(
      async () => {
        const userRecord = await this.getAuth().getUser(uid);
        return userRecord;
      },
      'getUser',
      { uid }
    );
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return this.withRetry(
      async () => {
        const userRecord = await this.getAuth().getUserByEmail(email);
        return userRecord;
      },
      'getUserByEmail',
      { email }
    );
  }

  async listUsers(maxResults?: number, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    return this.withRetry(
      async () => {
        const listUsersResult = await this.getAuth().listUsers(maxResults, pageToken);
        return listUsersResult;
      },
      'listUsers',
      { maxResults, pageToken }
    );
  }

  async setCustomClaims(uid: string, claims: object | null): Promise<void> {
    return this.withRetry(
      async () => {
        await this.getAuth().setCustomUserClaims(uid, claims);
        this.logger.info({ uid, claims }, 'Successfully set custom claims for user');
      },
      'setCustomClaims',
      { uid }
    );
  }

  async deleteUser(uid: string): Promise<void> {
    return this.withRetry(
      async () => {
        await this.getAuth().deleteUser(uid);
        this.logger.info({ uid }, 'Successfully deleted Firebase user');
      },
      'deleteUser',
      { uid }
    );
  }

  async updateUser(uid: string, props: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    return this.withRetry(
      async () => {
        const userRecord = await this.getAuth().updateUser(uid, props);
        this.logger.info({ uid, props }, 'Successfully updated Firebase user');
        return userRecord;
      },
      'updateUser',
      { uid }
    );
  }

  async verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<admin.auth.DecodedIdToken> {
    return this.withRetry(async () => {
      const decodedToken = await this.getAuth().verifyIdToken(idToken, checkRevoked);
      return decodedToken;
    }, 'verifyIdToken');
  }

  async createCustomToken(uid: string, developerClaims?: object): Promise<string> {
    return this.withRetry(
      async () => {
        const customToken = await this.getAuth().createCustomToken(uid, developerClaims);
        return customToken;
      },
      'createCustomToken',
      { uid }
    );
  }

  async createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string> {
    return this.withRetry(async () => {
      const sessionCookie = await this.getAuth().createSessionCookie(idToken, options);
      this.logger.info(
        {
          uid: (await this.verifyIdToken(idToken)).uid,
          expiresInSeconds: options.expiresIn / 1000,
        },
        'Successfully created Firebase session cookie'
      );
      return sessionCookie;
    }, 'createSessionCookie');
  }
}

// Removed default instance export - will be created centrally
// export const defaultFirebaseAdminService = new FirebaseAdminService();
