import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { FirebaseInitResult, UNIQUE_FIREBASE_ADMIN_APP_NAME } from './admin-types';
import { getFirebaseAdminGlobal, tryGetAuth } from './admin-utils';

// Create a module logger
const moduleLogger = logger.child({ module: 'firebase-admin-access' });

// Create a module-scoped reference to the global state
const firebaseAdminGlobal = getFirebaseAdminGlobal();

// MODIFIED: This function should ONLY get the app from the global symbol.
// It should NOT re-evaluate config or attempt to initialize.
export function getFirebaseAdminApp(): FirebaseInitResult {
  moduleLogger.info('[getFirebaseAdminApp] Attempting to retrieve app and auth from global.');

  const appInstance = firebaseAdminGlobal.appInstance;

  if (appInstance) {
    moduleLogger.info(
      `[getFirebaseAdminApp] Found app in global: ${appInstance.name}. Attempting to get auth.`
    );
    const auth = tryGetAuth(appInstance);
    return auth
      ? { app: appInstance, auth }
      : { app: appInstance, error: 'Failed to retrieve auth from existing global app.' };
  }

  // Attempt recovery from admin.apps as a fallback if not found globally.
  moduleLogger.warn(
    '[getFirebaseAdminApp] Firebase Admin app instance not found via global. Attempting SDK recovery.'
  );
  const recoveredApp = admin.apps.find(app => app?.name === UNIQUE_FIREBASE_ADMIN_APP_NAME);
  if (recoveredApp) {
    moduleLogger.warn(
      `[getFirebaseAdminApp] Recovered app by unique name '${UNIQUE_FIREBASE_ADMIN_APP_NAME}' from SDK. Caching it globally.`,
      { appName: recoveredApp.name }
    );
    firebaseAdminGlobal.appInstance = recoveredApp; // Cache it back
    const auth = tryGetAuth(recoveredApp);
    return auth
      ? { app: recoveredApp, auth }
      : { app: recoveredApp, error: 'Failed to retrieve auth from recovered SDK app.' };
  }

  moduleLogger.error(
    '[getFirebaseAdminApp] Firebase Admin app instance not found globally or by unique name in SDK registry.',
    { appNameSearched: UNIQUE_FIREBASE_ADMIN_APP_NAME }
  );
  return {
    error:
      'Firebase Admin App not initialized or unrecoverable. Call initializeFirebaseAdmin first.',
  };
}

// MODIFIED: This function now directly uses getFirebaseAdminApp and returns only the auth part or undefined.
export function getFirebaseAdminAuth(): admin.auth.Auth | undefined {
  moduleLogger.info('[getFirebaseAdminAuth] Attempting to retrieve auth service.');
  const { auth, error, app } = getFirebaseAdminApp(); // Get the full result

  if (error && !auth) {
    // If there was an error and auth couldn't be retrieved
    moduleLogger.warn(
      `[getFirebaseAdminAuth] Could not get Firebase Auth service due to: ${error}. App state: ${app ? app.name : 'undefined'}`
    );
    return undefined;
  }
  if (!auth && app) {
    moduleLogger.warn(
      `[getFirebaseAdminAuth] App '${app.name}' was found, but its Auth service could not be retrieved.`
    );
    return undefined;
  }
  if (!auth && !app) {
    moduleLogger.warn('[getFirebaseAdminAuth] Neither App nor Auth service could be retrieved.');
    return undefined;
  }

  return auth; // Returns auth if successful, or undefined if any issue occurred
}
