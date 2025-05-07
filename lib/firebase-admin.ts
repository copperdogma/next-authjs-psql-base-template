import * as admin from 'firebase-admin';
import pino from 'pino';
import { logger } from './logger'; // Import the actual logger

// Get the root logger instance
// import { logger as rootLogger } from '@/lib/logger'; // Avoid importing logger here if possible to reduce cycles

// Create a logger specific to this module if necessary, or rely on caller's logger
const moduleLogger = pino({ level: process.env.LOG_LEVEL || 'info' }).child({
  module: 'firebase-admin',
});

// Define types for configuration and initialization result
export interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail?: string | null; // Allow null/undefined
  privateKey?: string | null; // Allow null/undefined
  useEmulator: boolean;
  nodeEnv: 'production' | 'development' | 'test' | string; // Include NODE_ENV
}

export interface FirebaseInitResult {
  app?: admin.app.App;
  auth?: admin.auth.Auth;
  db?: admin.firestore.Firestore;
  error?: string;
}

// --- Helper Functions ---

/**
 * Validates the Firebase Admin configuration.
 */
function validateConfig(config: FirebaseAdminConfig): string | null {
  const requiredInProd: Array<keyof FirebaseAdminConfig> = ['clientEmail', 'privateKey'];

  // Only perform strict validation if in production OR if using credentials (not emulator)
  if (config.nodeEnv !== 'production' && config.useEmulator) {
    return null; // Skip validation for emulator use in non-prod
  }

  // Check required fields
  for (const key of requiredInProd) {
    if (!config[key]) {
      const message = `Missing Firebase Admin SDK config value for: ${key}`;
      // Throw in production to prevent startup with invalid config
      if (config.nodeEnv === 'production') {
        moduleLogger.error({ err: new Error(message) }, message);
        throw new Error(message);
      }
      // Return error message for non-production environments (when not using emulator)
      return message;
    }
  }

  return null; // No validation errors
}

/**
 * Sets up emulator environment variables.
 */
function setupEmulator(): void {
  moduleLogger.info('Configuring Firebase Admin SDK for EMULATOR use.');
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'; // Default Firestore emulator host
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'; // Default Auth emulator host
}

/**
 * Creates Firebase credentials from config.
 */
function createCredentials(config: FirebaseAdminConfig): FirebaseCredentials {
  if (!config.clientEmail || !config.privateKey) {
    // This should theoretically be caught by validateConfig, but helps type safety
    throw new Error('Client email and private key are required for credential creation.');
  }
  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey.replace(/\\n/g, '\n'), // Replace escaped newlines
  };
}

/**
 * Retrieves Firebase services (Auth, Firestore) from the app instance.
 */
function getFirebaseServices(app: admin.app.App): {
  auth?: admin.auth.Auth;
  db?: admin.firestore.Firestore;
  error?: string;
} {
  try {
    const auth = admin.auth(app);
    const db = admin.firestore(app);
    return { auth, db };
  } catch (error: unknown) {
    // Return the raw error message without wrapping it
    const errorMsg = error instanceof Error ? error.message : String(error);
    moduleLogger.error(
      { err: new Error(errorMsg) },
      'Failed to retrieve Auth or Firestore services from existing initialized app.'
    );
    return { error: errorMsg };
  }
}

/**
 * Attempts to retrieve an existing Firebase Admin app instance.
 * Checks globalThis in non-production and admin.apps in production.
 */
function getExistingFirebaseAdminApp(nodeEnv: FirebaseAdminConfig['nodeEnv']): {
  app?: admin.app.App;
  auth?: admin.auth.Auth;
  db?: admin.firestore.Firestore;
  error?: string;
} {
  const existingApp =
    nodeEnv !== 'production'
      ? (globalThis as GlobalWithFirebase)[FIREBASE_ADMIN_APP_KEY]
      : admin.apps.length > 0
        ? admin.app() // Get default app if already initialized in prod
        : undefined;

  if (existingApp) {
    logger.warn('Firebase Admin already initialized. Returning existing instance.');
    const servicesResult = getFirebaseServices(existingApp);
    if (servicesResult.error) {
      logger.error(
        { err: new Error(servicesResult.error) }, // Assuming servicesResult.error is a string message
        'Failed to retrieve Auth or Firestore services from existing initialized app.'
      );
      // Return the app even if services fail, along with the error
      return {
        app: existingApp,
        error: `Failed to retrieve Auth/Firestore services from existing app: ${servicesResult.error}`,
      };
    }
    // Assign to exported variables as well
    adminApp = existingApp;
    adminAuth = servicesResult.auth;
    adminDb = servicesResult.db;
    return { app: existingApp, auth: servicesResult.auth, db: servicesResult.db };
  }

  return {}; // No existing app found
}

/**
 * Performs the actual admin.initializeApp call based on config.
 */
function performInitialization(config: FirebaseAdminConfig): admin.app.App {
  if (config.useEmulator) {
    setupEmulator();
    return admin.initializeApp({ projectId: config.projectId });
  } else {
    const credentials = createCredentials(config);
    const credential = admin.credential.cert(credentials);
    // Ensure emulator hosts are unset if using credentials
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    return admin.initializeApp({ credential });
  }
}

// --- Main Initialization Function ---

// Use a symbol for unique global storage key
const FIREBASE_ADMIN_APP_KEY = Symbol.for('firebaseAdminApp');

// Define the type for the global object potentially holding our app
type GlobalWithFirebase = typeof globalThis & {
  [FIREBASE_ADMIN_APP_KEY]?: admin.app.App;
};

// Exported variables (will be assigned after initialization)
let adminApp: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;

// --- Helper: Get or Create App ---
// eslint-disable-next-line max-statements
function getOrCreateFirebaseAdminApp(config: FirebaseAdminConfig): FirebaseInitResult {
  // 1. Attempt to retrieve existing app
  const existingResult = getExistingFirebaseAdminApp(config.nodeEnv);
  if (existingResult.app) {
    // If an app was found (even with service errors), return it
    return existingResult;
  }

  // 2. Validate Configuration if creating new app
  const validationError = validateConfig(config);
  if (validationError) {
    logger.warn(
      'Firebase Admin SDK not initialized due to missing configuration in non-production environment.'
    );
    return { error: `Initialization failed: ${validationError}` };
  }

  // 3. Initialize App
  try {
    const app = performInitialization(config);
    logger.info('Firebase Admin SDK initialized successfully.');

    // Store globally in dev
    if (config.nodeEnv !== 'production') {
      (globalThis as GlobalWithFirebase)[FIREBASE_ADMIN_APP_KEY] = app;
    }

    // 4. Get Services
    const servicesResult = getFirebaseServices(app);
    if (servicesResult.error) {
      // Log the error but still return the app instance if initialization itself succeeded
      logger.error(
        { err: new Error(servicesResult.error) }, // Assuming servicesResult.error is a string message
        'Failed to get Firebase services after app initialization'
      );
    }

    // 5. Assign Singleton Instances to exported variables
    adminApp = app;
    adminAuth = servicesResult.auth; // Will be undefined if getFirebaseServices failed
    adminDb = servicesResult.db; // Will be undefined if getFirebaseServices failed

    return { app, auth: adminAuth, db: adminDb, error: servicesResult.error }; // Return potentially undefined services
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error({ err: new Error(errorMsg) }, 'Firebase Admin SDK initialization failed.');
    return { error: `Initialization failed: ${errorMsg}` };
  }
}

/**
 * Initializes the Firebase Admin SDK based on provided configuration.
 * Ensures singleton pattern (only initializes once), using globalThis in dev.
 * This function now primarily acts as a wrapper around getOrCreateFirebaseAdminApp
 * and ensures the exported variables `adminApp`, `adminAuth`, `adminDb` are set.
 */
export function initializeFirebaseAdmin(config: FirebaseAdminConfig): FirebaseInitResult {
  // The actual logic is now in getOrCreateFirebaseAdminApp
  // This call ensures the singleton logic runs and exported variables are populated
  const result = getOrCreateFirebaseAdminApp(config);

  // Log the final outcome for clarity
  if (result.error && !result.app) {
    // Only log fatal error if app itself couldn't be initialized/retrieved
    logger.error({ err: new Error(result.error) }, 'Firebase Admin initialization check failed'); // Assuming result.error is string
  } else if (result.error) {
    // Log warning if app exists but services failed
    logger.warn(
      { err: new Error(result.error) }, // Assuming result.error is string
      'Firebase Admin app initialized/retrieved, but failed to get services'
    );
  } else {
    logger.info('Firebase Admin initialization check completed successfully.');
  }

  // Return the result containing app, auth, db, and potential error
  return result;
}

// Export the initialized services (potentially undefined if init failed)
// These are assigned within getOrCreateFirebaseAdminApp
export { adminApp, adminAuth, adminDb };
