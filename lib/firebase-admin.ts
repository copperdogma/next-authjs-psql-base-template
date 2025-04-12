import * as admin from 'firebase-admin';
import { LoggerService } from './interfaces/services';
import { createContextLogger } from './services/logger-service';

// Removed unused type alias
// type FirebaseAdminApp = admin.app.App;

// Firebase Admin Module with LoggerService
class FirebaseAdminModule {
  private readonly logger: LoggerService;
  private appInstance: admin.app.App | null = null;
  private firebaseAdminInstance: typeof admin | null = null;

  constructor(logger?: LoggerService) {
    this.logger = logger || createContextLogger('firebase-admin');
  }

  /**
   * Checks if the key is a test key that should be ignored
   */
  private isTestKey(key: string): boolean {
    return key === 'test-private-key' || key.includes('test') || key === 'dummy-key';
  }

  /**
   * Formats the private key with proper newlines and headers
   */
  private formatPrivateKey(key: string): string {
    // Already properly formatted key
    if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('\n')) {
      return key;
    }

    // Handle escaped newlines (\\n)
    if (key.includes('\\n')) {
      return key.replace(/\\n/g, '\n');
    }

    // Handle keys without newlines but with proper header/footer
    if (key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('\n')) {
      return key
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    }

    // Default: return as is
    return key;
  }

  /**
   * Helper function to safely parse the private key
   */
  private parsePrivateKey(key?: string): string | undefined {
    if (!key) return undefined;

    // Test environment handling
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

    if (isTestEnvironment && this.isTestKey(key)) {
      this.logger.info('🔸 [Admin SDK] Using placeholder private key for test environment');
      return undefined;
    }

    return this.formatPrivateKey(key);
  }

  /**
   * Get the current environment's base URL for callbacks and redirects
   */
  private getEmulatorHost(): string | undefined {
    return process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }

  /**
   * Initialize Firebase Admin SDK with emulator settings if available.
   * Ensures only one instance is created.
   */
  // eslint-disable-next-line max-statements
  private initializeWithEmulators(): admin.app.App {
    if (this.appInstance) {
      return this.appInstance;
    }

    // For test environments, use minimal configuration
    const app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template',
    });

    // Get emulator host configuration
    const authEmulatorHostConfig = this.getEmulatorHost();

    if (authEmulatorHostConfig) {
      // Suppress logs in test environment
      if (process.env.NODE_ENV !== 'test') {
        this.logger.info(`🔸 [Admin SDK] Using Auth emulator at ${authEmulatorHostConfig}`);
      }
      // Auth emulator is auto-connected via environment variable
    }

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      // Suppress logs in test environment
      if (process.env.NODE_ENV !== 'test') {
        this.logger.info(
          `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
        );
      }
      // Firestore emulator auto-connected via env var
    }

    // Log connection status
    if (authEmulatorHostConfig && process.env.FIRESTORE_EMULATOR_HOST) {
      this.logger.info('🔸 [Admin SDK] Initialized for emulator use');
      this.logger.info(`🔸 [Admin SDK] Using Auth emulator at ${authEmulatorHostConfig}`);
      this.logger.info(
        `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
      );
    } else {
      this.logger.info('🔸 [Admin SDK] Initialized for production use (no emulators)');
    }

    this.appInstance = app;
    return app;
  }

  /**
   * Initialize Firebase Admin SDK using service account credentials.
   * Ensures only one instance is created.
   */
  private initializeWithCredentials(credentials: admin.ServiceAccount): admin.app.App {
    const app = admin.initializeApp({
      credential: admin.credential.cert(credentials as admin.ServiceAccount),
    });

    this.logger.info('✅ [Admin SDK] Initialized with service account credentials');
    return app;
  }

  /**
   * Initialize with minimal configuration (fallback)
   */
  private initializeWithMinimalConfig(): admin.app.App {
    const app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'default-project-id',
    });

    this.logger.warn(
      '⚠️ [Admin SDK] Initialized with minimal configuration due to missing credentials'
    );

    return app;
  }

  /**
   * Determines the appropriate initialization strategy based on environment and credentials
   */
  private getInitStrategy() {
    // Check if we're in test mode or using emulators
    const usingEmulators =
      process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

    if (usingEmulators) {
      return { strategy: 'emulators' };
    }

    // Get production credentials
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = this.parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
      return {
        strategy: 'credentials',
        credentials: { projectId, clientEmail, privateKey },
      };
    }

    return { strategy: 'minimal' };
  }

  /**
   * Gets the initialized Firebase Admin SDK instance, initializing it on first call.
   */
  // eslint-disable-next-line max-statements
  public getAdmin() {
    if (this.firebaseAdminInstance) {
      return this.firebaseAdminInstance;
    }

    try {
      // Check if already initialized (shouldn't happen with lazy init, but safe check)
      if (admin.apps.length > 0) {
        this.firebaseAdminInstance = admin;
        return admin;
      }

      // Determine initialization strategy
      const { strategy, credentials } = this.getInitStrategy();

      // Initialize based on strategy
      if (strategy === 'emulators') {
        this.initializeWithEmulators();
      } else if (strategy === 'credentials' && credentials) {
        this.initializeWithCredentials(credentials as admin.ServiceAccount);
      } else {
        this.initializeWithMinimalConfig();
      }

      // Log current environment for debugging
      // Suppress logs in test environment
      if (process.env.NODE_ENV !== 'test') {
        this.logger.info(`🔸 [Admin SDK] Current environment: ${process.env.NODE_ENV}`);
        this.logger.info(`🔸 [Admin SDK] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
      }

      // Log additional environment info for context
      this.logger.debug(
        {
          nodeEnv: process.env.NODE_ENV,
          nextauthUrl: process.env.NEXTAUTH_URL,
        },
        'Admin SDK Environment Context'
      );

      // Assign and return the initialized admin instance
      this.firebaseAdminInstance = admin;
      return this.firebaseAdminInstance;
    } catch (error) {
      this.logger.error({ err: error }, 'Error initializing Firebase Admin SDK');
      // Assign and return the base admin namespace even on error
      this.firebaseAdminInstance = admin;
      return this.firebaseAdminInstance;
    }
  }
}

// Create a singleton instance
const firebaseAdminModule = new FirebaseAdminModule();

/**
 * Gets the initialized Firebase Admin SDK instance, initializing it on first call.
 * This is a singleton getter to maintain backward compatibility.
 */
function getFirebaseAdmin() {
  return firebaseAdminModule.getAdmin();
}

// Export the getter function instead of the instance
export { getFirebaseAdmin, FirebaseAdminModule };

// For compatibility, provide a default export that calls the getter
// Note: Direct default export might still cause issues in some testing scenarios
// Prefer using the named export `getFirebaseAdmin` where possible.
const defaultExport = getFirebaseAdmin();
export default defaultExport;
