import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';

/**
 * Checks if the key is a test key that should be ignored
 */
function isTestKey(key: string): boolean {
  return key === 'test-private-key' || key.includes('test') || key === 'dummy-key';
}

/**
 * Formats the private key with proper newlines and headers
 */
function formatPrivateKey(key: string): string {
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
function parsePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;

  // Test environment handling
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

  if (isTestEnvironment && isTestKey(key)) {
    logger.info('🔸 [Admin SDK] Using placeholder private key for test environment');
    return undefined;
  }

  return formatPrivateKey(key);
}

/**
 * Get the current environment's base URL for callbacks and redirects
 */
function getEmulatorHost(): string | undefined {
  // If explicitly set via environment variables, use those
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }

  // For local development with custom ports
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT;
  if (port && process.env.NODE_ENV !== 'production') {
    logger.info(`🔸 [Admin SDK] Detected custom port: ${port}`);
    return `localhost:9099`; // Auth emulator default port
  }

  return undefined;
}

/**
 * Initialize with emulator configuration
 */
function initializeWithEmulators(): admin.app.App {
  // For test environments, use minimal configuration
  const app = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'test-project-id',
  });

  // Suppress logs in test environment
  if (process.env.NODE_ENV !== 'test') {
    logger.info('🔸 [Admin SDK] Initialized for emulator use');
  }

  // Get emulator host configuration
  const authEmulatorHost = getEmulatorHost();

  if (authEmulatorHost) {
    // Suppress logs in test environment
    if (process.env.NODE_ENV !== 'test') {
      logger.info(`🔸 [Admin SDK] Using Auth emulator at ${authEmulatorHost}`);
    }
    // Auth emulator is auto-connected via environment variable
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Suppress logs in test environment
    if (process.env.NODE_ENV !== 'test') {
      logger.info(
        `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
      );
    }
    // The Firebase Admin SDK automatically detects and uses the FIRESTORE_EMULATOR_HOST
    // environment variable - no explicit API call needed for v13+
  }

  // Log connection status
  if (authEmulatorHost && process.env.FIRESTORE_EMULATOR_HOST) {
    logger.info('🔸 [Admin SDK] Initialized for emulator use');
    logger.info(`🔸 [Admin SDK] Using Auth emulator at ${authEmulatorHost}`);
    logger.info(
      `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
    );
  } else {
    logger.warn(
      '⚠️ [Admin SDK] Emulators not fully configured. Check FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST environment variables.'
    );
  }

  return app;
}

/**
 * Initialize with production credentials
 */
function initializeWithCredentials(
  projectId: string,
  clientEmail: string,
  privateKey: string
): admin.app.App {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  logger.info('✅ [Admin SDK] Initialized with service account credentials');
  return app;
}

/**
 * Initialize with minimal configuration (fallback)
 */
function initializeWithMinimalConfig(): admin.app.App {
  const app = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'default-project-id',
  });

  logger.warn('⚠️ [Admin SDK] Initialized with minimal configuration due to missing credentials');

  return app;
}

/**
 * Determines the appropriate initialization strategy based on environment and credentials
 */
function getInitStrategy() {
  // Check if we're in test mode or using emulators
  const usingEmulators =
    process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

  if (usingEmulators) {
    return { strategy: 'emulators' };
  }

  // Get production credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return {
      strategy: 'credentials',
      credentials: { projectId, clientEmail, privateKey },
    };
  }

  return { strategy: 'minimal' };
}

// Store the initialized instance
let firebaseAdminInstance: typeof admin | null = null;

/**
 * Gets the initialized Firebase Admin SDK instance, initializing it on first call.
 */
// eslint-disable-next-line max-statements
function getFirebaseAdmin() {
  if (firebaseAdminInstance) {
    return firebaseAdminInstance;
  }

  try {
    // Check if already initialized (shouldn't happen with lazy init, but safe check)
    if (admin.apps.length > 0) {
      firebaseAdminInstance = admin;
      return admin;
    }

    // Determine initialization strategy
    const { strategy, credentials } = getInitStrategy();

    // Initialize based on strategy
    if (strategy === 'emulators') {
      initializeWithEmulators();
    } else if (strategy === 'credentials' && credentials) {
      initializeWithCredentials(
        credentials.projectId,
        credentials.clientEmail,
        credentials.privateKey
      );
    } else {
      initializeWithMinimalConfig();
    }

    // Log current environment for debugging
    // Suppress logs in test environment
    if (process.env.NODE_ENV !== 'test') {
      logger.info(`🔸 [Admin SDK] Current environment: ${process.env.NODE_ENV}`);
      logger.info(`🔸 [Admin SDK] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
    }

    // Log additional environment info for context
    logger.debug(
      {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
      },
      'Admin SDK Environment Context'
    );

    // Assign and return the initialized admin instance
    firebaseAdminInstance = admin;
    return firebaseAdminInstance;
  } catch (error) {
    logger.error({ err: error }, 'Error initializing Firebase Admin SDK');
    // Assign and return the base admin namespace even on error
    firebaseAdminInstance = admin;
    return firebaseAdminInstance;
  }
}

// Export the getter function instead of the instance
export { getFirebaseAdmin };

// For compatibility, provide a default export that calls the getter
// Note: Direct default export might still cause issues in some testing scenarios
// Prefer using the named export `getFirebaseAdmin` where possible.
const defaultExport = getFirebaseAdmin();
export default defaultExport;
