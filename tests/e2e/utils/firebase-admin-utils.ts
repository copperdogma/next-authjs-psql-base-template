import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';

let adminAppInstance: admin.app.App | null = null;

/**
 * Initializes and returns the Firebase Admin SDK App instance (singleton).
 * Uses environment variables for configuration.
 */
export function initializeAdminApp(): admin.app.App | null {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  if (admin.apps.length > 0) {
    adminAppInstance = admin.app();
    logger.info(
      { module: 'firebase-admin-utils', appName: adminAppInstance.name },
      'Using existing default Firebase Admin app.'
    );
    return adminAppInstance;
  }

  try {
    adminAppInstance = _attemptInitializeAdminApp();
  } catch (error) {
    logger.error(
      { module: 'firebase-admin-utils', err: error },
      'Failed to initialize Firebase Admin SDK for tests.'
    );
    // adminAppInstance will remain null or be what _attemptInitializeAdminApp set before throwing
  }

  return adminAppInstance;
}

function _attemptInitializeAdminApp(): admin.app.App | null {
  const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  const gcpProjectId = process.env.FIREBASE_PROJECT_ID; // For GAE/Cloud Run
  let app: admin.app.App | null = null;

  if (serviceAccountKeyJson) {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info(
      { module: 'firebase-admin-utils', appName: app.name },
      'Initialized Firebase Admin SDK using JSON key.'
    );
  } else if (gcpProjectId) {
    app = admin.initializeApp(); // Uses ADC by default
    logger.info(
      { module: 'firebase-admin-utils', appName: app.name },
      'Initialized Firebase Admin SDK using Application Default Credentials.'
    );
  } else {
    logger.warn(
      { module: 'firebase-admin-utils' },
      'Firebase Admin SDK could not be initialized for tests. Missing FIREBASE_SERVICE_ACCOUNT_KEY_JSON or FIREBASE_PROJECT_ID.'
    );
    // app remains null
  }
  return app;
}

/**
 * Deletes a Firebase user by email using the Admin SDK.
 * Tolerates 'user-not-found' errors.
 */
export async function deleteFirebaseUserByEmail(app: admin.app.App, email: string): Promise<void> {
  logger.debug(
    { module: 'firebase-admin-utils', email },
    'Attempting to delete Firebase user by email...'
  );
  try {
    const user = await app.auth().getUserByEmail(email);
    await app.auth().deleteUser(user.uid);
    logger.info(
      { module: 'firebase-admin-utils', email, uid: user.uid },
      'Successfully deleted Firebase user by email.'
    );
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      logger.info(
        { module: 'firebase-admin-utils', email },
        'Firebase user not found, no deletion needed.'
      );
    } else {
      logger.error(
        { module: 'firebase-admin-utils', email, error },
        'Error deleting Firebase user by email.'
      );
      // Rethrow potentially critical errors?
    }
  }
}
