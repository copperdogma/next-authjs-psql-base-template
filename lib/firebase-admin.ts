import * as admin from 'firebase-admin';
import pino from 'pino';

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
        moduleLogger.error(message);
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
    const errorMessage = `Failed to retrieve Auth/Firestore services from initialized app.`;
    const errorMsg = error instanceof Error ? error.message : String(error);
    moduleLogger.error({ error: errorMsg }, errorMessage);
    return { error: `${errorMessage} Error: ${errorMsg}` };
  }
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

let adminApp: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;

/**
 * Initializes the Firebase Admin SDK based on provided configuration.
 * Ensures singleton pattern (only initializes once).
 */
// eslint-disable-next-line max-statements -- Statements slightly high after refactor, deemed acceptable
export function initializeFirebaseAdmin(config: FirebaseAdminConfig): FirebaseInitResult {
  // Check if Admin SDK is already initialized (e.g., in another function)
  if (admin.apps.length > 0) {
    moduleLogger.warn('Firebase Admin already initialized. Skipping re-initialization.');
    // Return existing services (or attempt to retrieve them)
    try {
      const existingApp = admin.app(); // Get default app
      const existingAuth = admin.auth(existingApp);
      const existingDb = admin.firestore(existingApp);
      return { app: existingApp, auth: existingAuth, db: existingDb };
    } catch (error) {
      moduleLogger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to retrieve Auth/Firestore services from initialized app.'
      );
      return {
        error: `Failed to retrieve Auth/Firestore services from initialized app. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // 2. Validate Configuration
  const validationError = validateConfig(config);
  if (validationError) {
    moduleLogger.warn(
      'Firebase Admin SDK not initialized due to missing configuration in non-production environment.'
    );
    return { error: `Initialization failed: Invalid configuration state.` }; // Return generic error
  }

  // 3. Initialize App
  try {
    // Delegate actual initialization to helper
    const app = performInitialization(config);
    moduleLogger.info('Firebase Admin SDK initialized successfully.');

    // 4. Get Services
    const servicesResult = getFirebaseServices(app);

    // 5. Store Singleton Instances
    adminApp = app;
    if (servicesResult.auth) adminAuth = servicesResult.auth;
    if (servicesResult.db) adminDb = servicesResult.db;

    return { app, ...servicesResult };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    moduleLogger.error({ error: errorMsg }, 'Firebase Admin SDK initialization failed.');
    return { error: errorMsg };
  }
}

// Export the initialized services (potentially undefined if init failed)
export { adminApp, adminAuth, adminDb };
