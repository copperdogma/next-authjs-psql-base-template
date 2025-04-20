import * as admin from 'firebase-admin';
import { logger } from './logger'; // Use correct export name 'logger'

const serviceLogger = logger.child({ service: 'firebase-admin' }); // Use 'logger'

let firebaseAdminApp: admin.app.App | null = null;

/**
 * Formats the private key string from environment variables into the format required by Firebase Admin SDK.
 * Handles keys with escaped newlines (\\n) or missing newlines.
 *
 * @param key - The private key string from the environment variable.
 * @returns The formatted private key string.
 */
const formatPrivateKey = (key: string): string => {
  // Handle keys with escaped newlines (\\n)
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }

  // Handle keys without newlines between the header and footer
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';

  if (key.includes(beginMarker) && key.includes(endMarker)) {
    // Extract the content between markers
    const contentStartIndex = key.indexOf(beginMarker) + beginMarker.length;
    const contentEndIndex = key.indexOf(endMarker);
    let content = key.substring(contentStartIndex, contentEndIndex).trim();

    // If no newlines exist, add them appropriately
    if (!key.includes('\n')) {
      return `${beginMarker}\n${content}\n${endMarker}`;
    }
  }

  // Assume it's already formatted correctly or is a simple string
  return key;
};

/**
 * Checks if Firebase emulator mode is enabled.
 *
 * @returns True if using Firebase emulators, false otherwise
 */
const isUsingEmulator = (): boolean => {
  return (
    process.env.USE_FIREBASE_EMULATOR === 'true' ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIRESTORE_EMULATOR_HOST
  );
};

/**
 * Initializes Firebase Admin in emulator mode
 * @returns The initialized Firebase Admin App
 */
const initializeEmulator = (): admin.app.App => {
  // Prioritize FIREBASE_PROJECT_ID env var if set, otherwise use default emulator ID
  const projectId = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template-emulator';

  // Set the emulator host environment variable explicitly IF not already set
  // This helps ensure the SDK connects locally, even if the env var isn't inherited perfectly
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST =
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    serviceLogger.warn(
      'FIREBASE_AUTH_EMULATOR_HOST was not set, setting explicitly for Admin SDK.'
    );
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
    serviceLogger.warn('FIRESTORE_EMULATOR_HOST was not set, setting explicitly for Admin SDK.');
  }

  serviceLogger.info(
    {
      projectId,
      authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    },
    'Initializing Admin SDK for Emulators...'
  );

  // Initialize with just the projectId. The SDK should automatically
  // pick up the FIREBASE_AUTH_EMULATOR_HOST/FIRESTORE_EMULATOR_HOST environment variables.
  const app = admin.initializeApp({ projectId });

  serviceLogger.info({ projectId }, '✅ [Admin SDK] Initialized for Firebase Emulators.');
  return app;
};

/**
 * Validates Firebase credentials from environment variables
 * @returns Validated credential values
 * @throws Error if any credential is missing
 */
const validateCredentials = (): { projectId: string; clientEmail: string; privateKey: string } => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missingCredentials = {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!rawPrivateKey,
    };

    serviceLogger.error(
      missingCredentials,
      '❌ [Admin SDK] Missing required Firebase Admin credentials in environment variables.'
    );

    throw new Error(
      'Missing Firebase Admin SDK credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: formatPrivateKey(rawPrivateKey),
  };
};

/**
 * Initialize Firebase Admin with credentials
 * @returns Initialized Firebase Admin App
 */
const initializeWithCredentials = (): admin.app.App => {
  const { projectId, clientEmail, privateKey } = validateCredentials();

  // Create the credential using admin.credential.cert
  const credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });

  // Initialize with credential
  const app = admin.initializeApp({
    credential,
  });

  serviceLogger.info({ projectId }, '✅ [Admin SDK] Initialized with service account credentials.');

  return app;
};

/**
 * Initializes the Firebase Admin SDK application instance.
 * Ensures that only one instance is created (singleton pattern).
 * Reads credentials from environment variables.
 * Handles both emulator and production/credential-based initialization.
 *
 * @returns The initialized Firebase Admin `App` instance.
 * @throws Error if initialization fails.
 */
export const initializeFirebaseAdminApp = (): admin.app.App => {
  // Return existing instance if available
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  // Check for existing Firebase apps
  const apps = admin.apps;
  if (apps && apps.length > 0 && apps[0] !== null) {
    firebaseAdminApp = apps[0];
    serviceLogger.info('🔸 [Admin SDK] Reusing existing Firebase Admin App instance.');
    return firebaseAdminApp;
  }

  try {
    // Initialize for emulator or with credentials
    if (isUsingEmulator()) {
      firebaseAdminApp = initializeEmulator();
    } else {
      firebaseAdminApp = initializeWithCredentials();
    }

    return firebaseAdminApp;
  } catch (error) {
    serviceLogger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '❌ [Admin SDK] Failed to initialize Firebase Admin SDK.'
    );
    // Re-throw the error
    throw error;
  }
};
