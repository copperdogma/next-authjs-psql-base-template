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
   * Verify a Firebase ID token
   * @param token Firebase ID token to verify
   */
  async verifyIdToken(token: string) {
    this.logger.trace(
      { token: token ? token.substring(0, 10) + '...' : '[empty]' },
      'Verifying ID token'
    );
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
   * @param data Object containing profile updates (e.g., { displayName: 'New Name' })
   */
  async updateUser(uid: string, data: { displayName?: string }) {
    this.logger.debug({ uid, data }, 'Updating user');
    // Directly pass the data object which conforms to UpdateRequest interface implicitly
    return this.auth().updateUser(uid, data);
  }

  /**
   * Creates a custom token for authentication
   */
  async createCustomToken(uid: string, claims?: Record<string, unknown>) {
    this.logger.debug({ uid, hasClaims: !!claims }, 'Creating custom token');
    return this.auth().createCustomToken(uid, claims);
  }
}

// Removed default instance export - will be created centrally
// export const defaultFirebaseAdminService = new FirebaseAdminService();
