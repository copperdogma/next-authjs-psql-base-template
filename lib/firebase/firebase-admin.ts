import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';

// Initialize as undefined
let app: admin.app.App | undefined;
// Lock to prevent simultaneous initializations
let initializationLock = false;

/**
 * Helper function to check if all required Firebase credentials are available
 */
function checkRequiredCredentials(): { isValid: boolean; error?: string } {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return { isValid: false, error: 'FIREBASE_PROJECT_ID is not set in environment variables.' };
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    return { isValid: false, error: 'FIREBASE_CLIENT_EMAIL is not set in environment variables.' };
  }
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    return { isValid: false, error: 'FIREBASE_PRIVATE_KEY is not set in environment variables.' };
  }
  return { isValid: true };
}

/**
 * Creates Firebase credential object from environment variables
 */
function createFirebaseCredentials(): admin.ServiceAccount {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

  return {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey,
  };
}

/**
 * Attempts to find an existing Firebase Admin app
 */
function findExistingApp(): admin.app.App | undefined {
  if (admin.apps.length > 0) {
    const existingApp = admin.apps[0];
    if (existingApp) {
      logger.info('Found existing Firebase Admin SDK app, reusing it.');
      return existingApp;
    }
  }
  return undefined;
}

/**
 * Initializes a new Firebase Admin app
 */
function initializeNewApp(credentials: admin.ServiceAccount): admin.app.App | undefined {
  try {
    logger.info('Initializing Firebase Admin SDK...');
    const newApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    logger.info('Firebase Admin SDK initialized successfully.');
    return newApp;
  } catch (error) {
    logger.error({ err: error }, 'Firebase Admin SDK initialization failed');
    throw new Error('Could not initialize Firebase Admin SDK. Check server logs for details.');
  }
}

/**
 * Performs the actual app initialization logic with proper error handling
 */
function performAppInitialization(): admin.app.App | undefined {
  // Check for existing app first
  const existingApp = findExistingApp();
  if (existingApp) return existingApp;

  // Validate required credentials
  const { isValid, error } = checkRequiredCredentials();
  if (!isValid) {
    throw new Error(error);
  }

  // Create credentials and initialize
  const credentials = createFirebaseCredentials();
  return initializeNewApp(credentials);
}

/**
 * Initializes and returns the Firebase Admin SDK App instance (Singleton).
 * Uses environment variables for configuration.
 * Implements double-check locking pattern for thread safety.
 */
export function getFirebaseAdminApp(): admin.app.App | undefined {
  // Fast path: return immediately if initialized
  if (app) {
    return app;
  }

  // Wait if initialization is in progress
  if (initializationLock) {
    logger.debug('Firebase Admin SDK initialization in progress, waiting...');
    // Simple blocking wait - in a real system, consider using a promise-based approach
    while (initializationLock) {
      // Micro-wait
    }
    return app;
  }

  // Acquire lock, initialize, and release lock
  initializationLock = true;
  try {
    // Double-check pattern: verify again after acquiring lock
    if (!app) {
      app = performAppInitialization();
    }
  } finally {
    initializationLock = false;
  }

  return app;
}

// Initialize on load (optional, alternative is to call getFirebaseAdminApp() when needed)
// getFirebaseAdminApp();
