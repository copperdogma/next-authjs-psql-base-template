import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger'; // Assuming logger is imported like this
import { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services';

// Determine the frequency for initialization checks (e.g., every 5 minutes)
const INIT_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class FirebaseAdminServiceImpl implements FirebaseAdminServiceInterface {
  private app: admin.app.App | null = null;
  private lastInitCheckTimestamp = 0;

  constructor() {
    this.initializeApp(); // Initialize on instantiation
  }

  private _getIndividualEnvCredentials(): admin.credential.Credential | undefined {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // If in test environment and using the known dummy private key, skip attempting to use it.
    // This prevents an error log and allows fallback to ADC or emulator auto-configuration.
    // Also skip if explicitly in E2E test environment.
    if (
      (process.env.NODE_ENV === 'test' && privateKey === 'test-private-key') ||
      process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true'
    ) {
      logger.info(
        { module: 'firebase-admin' },
        'Test or E2E environment detected (or dummy key in test env). Skipping explicit credential creation, will rely on ADC or emulator auto-config.'
      );
      return undefined;
    }

    if (projectId && clientEmail && privateKey) {
      logger.info(
        { module: 'firebase-admin', projectId },
        'Attempting to initialize with explicit FIREBASE_PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY.'
      );
      try {
        return admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        });
      } catch (error) {
        logger.error(
          { module: 'firebase-admin', err: error },
          'Failed to create credential object from individual Firebase Admin SDK env vars.'
        );
      }
    }
    return undefined;
  }

  private _getServiceAccountFileCredentials(): admin.credential.Credential | undefined {
    const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
    if (serviceAccountKeyJson) {
      logger.info(
        { module: 'firebase-admin' },
        'Attempting to initialize with FIREBASE_SERVICE_ACCOUNT_KEY_JSON.'
      );
      try {
        const serviceAccount = JSON.parse(serviceAccountKeyJson);
        return admin.credential.cert(serviceAccount);
      } catch (error) {
        logger.error(
          { module: 'firebase-admin', err: error },
          'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON or create credential from it.'
        );
      }
    }
    return undefined;
  }

  private _createAdminCredential(): admin.credential.Credential | undefined {
    // If in an E2E test environment (indicated by NEXT_PUBLIC_IS_E2E_TEST_ENV),
    // prefer ADC/emulator auto-config to avoid parsing dummy test credentials.
    if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true') {
      logger.info(
        { module: 'firebase-admin' },
        'E2E test environment detected (NEXT_PUBLIC_IS_E2E_TEST_ENV=true). Firebase Admin SDK will rely on ADC or emulator auto-configuration. Skipping explicit cert credential creation.'
      );
      return undefined;
    }

    const individualEnvCred = this._getIndividualEnvCredentials();
    if (individualEnvCred) {
      return individualEnvCred;
    }

    const serviceAccountFileCred = this._getServiceAccountFileCredentials();
    if (serviceAccountFileCred) {
      return serviceAccountFileCred;
    }

    return undefined;
  }

  private initializeApp(): void {
    logger.debug({ module: 'firebase-admin' }, 'Attempting to initialize Firebase Admin SDK...');

    if (admin.apps.length > 0) {
      this.app = admin.app();
      logger.info(
        { module: 'firebase-admin', appName: this.app.name },
        'Firebase Admin SDK already initialized. Using existing default app.'
      );
      this.lastInitCheckTimestamp = Date.now();
      return;
    }

    const credentialToUse = this._createAdminCredential();
    const projectId = process.env.FIREBASE_PROJECT_ID;

    let initializedByConstructedCred = false;
    if (credentialToUse) {
      initializedByConstructedCred = this._initializeWithConstructedCredential(credentialToUse);
    }

    // If not initialized by constructed credential, try ADC if projectId is available
    if (!initializedByConstructedCred) {
      if (!this._tryInitializeWithAdc(projectId)) {
        // This case means:
        // 1. No credentialToUse AND no projectId OR
        // 2. credentialToUse existed, _initializeWithConstructedCredential failed, AND no projectId OR
        // 3. _tryInitializeWithAdc failed (either no projectId or init itself failed)
        logger.warn(
          { module: 'firebase-admin' },
          'Firebase Admin SDK could not be initialized. No valid credentials or projectId for ADC, or ADC initialization failed.'
        );
        this.app = null; // Ensure app is null if all attempts fail
      }
    } // If initializedByConstructedCred is true, or _tryInitializeWithAdc was successful, we are done.
  }

  private _initializeWithConstructedCredential(credential: admin.credential.Credential): boolean {
    try {
      this.app = admin.initializeApp({ credential });
      logger.info(
        { module: 'firebase-admin', appName: this.app.name },
        'Firebase Admin SDK initialized successfully using constructed credentials.'
      );
      this.lastInitCheckTimestamp = Date.now();
      return true;
    } catch (error) {
      logger.error(
        { module: 'firebase-admin', err: error },
        'Failed to initialize Firebase Admin SDK with constructed credential. Will attempt ADC if projectId is available.'
      );
      this.app = null;
      return false;
    }
  }

  private _tryInitializeWithAdc(projectId?: string): boolean {
    if (!projectId) {
      logger.debug(
        { module: 'firebase-admin' },
        'Skipping ADC initialization as no projectId is available.'
      );
      return false;
    }

    logger.info(
      { module: 'firebase-admin', projectId },
      'Attempting Application Default Credentials with projectId.'
    );
    try {
      this.app = admin.initializeApp({ projectId });
      logger.info(
        { module: 'firebase-admin', appName: this.app.name, projectIdUsed: projectId },
        'Firebase Admin SDK initialized successfully using Application Default Credentials with explicit projectId.'
      );
      this.lastInitCheckTimestamp = Date.now();
      return true;
    } catch (error) {
      logger.error(
        { module: 'firebase-admin', err: error },
        'Failed to initialize Firebase Admin SDK using Application Default Credentials.'
      );
      this.app = null;
      return false;
    }
  }

  private ensureInitialized(): admin.app.App {
    const now = Date.now();
    // Check if app is null OR if the check interval has passed
    if (!this.app || now - this.lastInitCheckTimestamp > INIT_CHECK_INTERVAL_MS) {
      logger.info(
        {
          module: 'firebase-admin',
          appExists: !!this.app,
          intervalPassed: now - this.lastInitCheckTimestamp > INIT_CHECK_INTERVAL_MS,
        },
        'Re-checking Firebase Admin SDK initialization status...'
      );
      this.initializeApp(); // Attempt to re-initialize
    }

    if (!this.app) {
      logger.error(
        { module: 'firebase-admin' },
        'Firebase Admin SDK is not initialized. Throwing error.'
      );
      throw new Error('Firebase Admin SDK is not initialized. Check server logs for details.');
    }
    // Return the guaranteed non-null app
    return this.app;
  }

  public isInitialized(): boolean {
    try {
      this.ensureInitialized();
      return true;
    } catch {
      return false;
    }
  }

  public getAuth(): admin.auth.Auth {
    const app = this.ensureInitialized(); // Get guaranteed non-null app
    return app.auth();
  }

  public getFirestore(): admin.firestore.Firestore {
    const app = this.ensureInitialized(); // Get guaranteed non-null app
    return app.firestore();
  }

  public getStorage(): admin.storage.Storage {
    const app = this.ensureInitialized(); // Get guaranteed non-null app
    return app.storage();
  }

  public async createUser(properties: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    const app = this.ensureInitialized();
    return app.auth().createUser(properties);
  }

  public async updateUser(
    uid: string,
    properties: admin.auth.UpdateRequest
  ): Promise<admin.auth.UserRecord> {
    const app = this.ensureInitialized();
    return app.auth().updateUser(uid, properties);
  }

  public async verifyIdToken(
    idToken: string,
    checkRevoked?: boolean
  ): Promise<admin.auth.DecodedIdToken> {
    const app = this.ensureInitialized();
    return app.auth().verifyIdToken(idToken, checkRevoked);
  }

  public async createCustomToken(uid: string, developerClaims?: object): Promise<string> {
    const app = this.ensureInitialized();
    return app.auth().createCustomToken(uid, developerClaims);
  }

  private _parseFirebaseError(error: unknown): {
    errorCode?: string;
    message?: string;
    stack?: string;
    originalError: unknown;
  } {
    let errorCode: string | undefined;
    let stack: string | undefined;

    // Initialize message with a generic fallback, will be overwritten if a better one is found.
    let message: string = 'Unknown or non-string error object received';

    if (typeof error === 'object' && error !== null) {
      const errObj = error as { code?: unknown; message?: unknown; stack?: unknown };
      if (typeof errObj.code === 'string') {
        errorCode = errObj.code;
      }
      if (typeof errObj.message === 'string') {
        message = errObj.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (error instanceof Error) {
        stack = error.stack;
      }
    } else {
      message = String(error);
    }

    return { errorCode, message, stack, originalError: error };
  }

  public async getUser(uid: string): Promise<admin.auth.UserRecord> {
    const app = this.ensureInitialized();
    const logContext = { uid, module: 'firebase-admin-service', operation: 'getUser' };
    logger.debug(logContext, 'Attempting to get user from Firebase.');
    try {
      const userRecord = await app.auth().getUser(uid);
      logger.info(
        { ...logContext, firebaseUserId: userRecord.uid },
        'Successfully fetched user from Firebase.'
      );
      return userRecord;
    } catch (error: unknown) {
      const parsedError = this._parseFirebaseError(error);
      logger.error(
        {
          ...logContext,
          errorCode: parsedError.errorCode,
          errorMessage: parsedError.message,
          errorStack: parsedError.stack,
          rawError: parsedError.originalError, // Log the original error too
        },
        'Error fetching user from Firebase Admin SDK.'
      );

      // Re-throw intelligently
      if (parsedError.errorCode) {
        // If there's an error code, it's likely a FirebaseError or similar, re-throw it directly.
        throw parsedError.originalError;
      } else {
        // Otherwise, wrap in a new error with the parsed message.
        throw new Error(`Failed to get Firebase user ${uid}: ${parsedError.message}`);
      }
    }
  }

  public async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    const app = this.ensureInitialized();
    return app.auth().getUserByEmail(email);
  }

  public async deleteUser(uid: string): Promise<void> {
    const app = this.ensureInitialized();
    logger.debug({ uid, module: 'firebase-admin' }, 'Attempting to delete Firebase user.');
    try {
      await app.auth().deleteUser(uid);
      logger.info({ uid, module: 'firebase-admin' }, 'Successfully deleted Firebase user.');
    } catch (error) {
      logger.error({ uid, error, module: 'firebase-admin' }, 'Failed to delete Firebase user.');
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  // Add other Firebase Admin SDK methods as needed
}

// Export a singleton instance
export const firebaseAdminServiceImpl = new FirebaseAdminServiceImpl();
