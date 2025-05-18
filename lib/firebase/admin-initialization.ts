import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import {
  FirebaseAdminConfig,
  FirebaseInitResult,
  UNIQUE_FIREBASE_ADMIN_APP_NAME,
  FirebaseAdminGlobal,
} from './admin-types';
import {
  validateConfig,
  setupEmulator,
  createCredentials,
  tryGetAuth,
  safeConfigLogging,
  getFirebaseAdminGlobal,
} from './admin-utils';

// Create a module logger
const moduleLogger = logger.child({ module: 'firebase-admin-initialization' });

// Create a module-scoped reference to the global state
const firebaseAdminGlobal = getFirebaseAdminGlobal();

// Helper for emulator-specific initialization steps
function _initializeForEmulator(config: FirebaseAdminConfig, appName: string): admin.app.App {
  setupEmulator();
  moduleLogger.info(
    { projectId: config.projectId },
    '[Firebase Admin Init - Emulator Path] Initializing app with ONLY projectId for emulator.'
  );
  return admin.initializeApp({ projectId: config.projectId }, appName);
}

// Helper for credential-based initialization steps
function _initializeWithCredentials(
  config: FirebaseAdminConfig,
  appName: string
): FirebaseInitResult | admin.app.App {
  const validationError = validateConfig(config);
  if (validationError) {
    moduleLogger.error(
      { error: validationError, configUsed: safeConfigLogging(config) },
      '[Firebase Admin Init] Invalid Firebase Admin config for non-emulator path.'
    );
    return { error: `Invalid Firebase Admin config: ${validationError}` };
  }
  const credentials = createCredentials(config);
  moduleLogger.info(
    { projectId: config.projectId, appName },
    '[Firebase Admin Init] Configuring for NON-EMULATOR use with credentials.'
  );
  return admin.initializeApp(
    { credential: admin.credential.cert(credentials), projectId: config.projectId },
    appName
  );
}

// Helper to finalize initialization after app is created
function _finalizeInitialization(
  app: admin.app.App,
  globalAdmin: FirebaseAdminGlobal
): FirebaseInitResult {
  globalAdmin.appInstance = app;
  moduleLogger.info(
    `[Firebase Admin Init] Firebase Admin SDK initialized successfully. App name: '${app.name}'. Stored in global symbol.`
  );
  const auth = tryGetAuth(app);
  if (!auth) {
    moduleLogger.error(
      { appName: app.name },
      '[Firebase Admin Init] CRITICAL: Successfully initialized app but failed to retrieve its Auth service.'
    );
    return {
      app,
      error: 'Successfully initialized app but failed to retrieve its Auth service.',
    };
  }
  return { app, auth };
}

// Helper to handle existing app scenarios
function _handleExistingApp(
  appName: string,
  globalAdmin: FirebaseAdminGlobal
): FirebaseInitResult | null {
  if (globalAdmin.appInstance && globalAdmin.appInstance.name === appName) {
    moduleLogger.info(`[Firebase Admin Init] Using existing Firebase Admin app from global.`);
    const existingApp = globalAdmin.appInstance;
    // This check is a bit redundant given the outer if, but good for robustness
    if (!existingApp) {
      moduleLogger.error(
        '[Firebase Admin Init] Global app instance was unexpectedly undefined after check.'
      );
      return { error: 'Internal error: Global app instance lost.' };
    }
    const auth = tryGetAuth(existingApp);
    return auth
      ? { app: existingApp, auth }
      : { app: existingApp, error: 'Failed to retrieve auth from existing global app.' };
  }

  const existingSdkApp = admin.apps.find(app => app?.name === appName);
  if (existingSdkApp) {
    moduleLogger.warn(
      `[Firebase Admin Init] Recovered existing app '${appName}' from admin.apps. Updating global symbol.`
    );
    globalAdmin.appInstance = existingSdkApp;
    const auth = tryGetAuth(existingSdkApp);
    return auth
      ? { app: existingSdkApp, auth }
      : { app: existingSdkApp, error: 'Failed to retrieve auth from recovered SDK app.' };
  }
  return null; // No existing app found
}

// Helper to perform new app initialization
function _performNewInitialization(
  config: FirebaseAdminConfig,
  appName: string,
  globalAdmin: FirebaseAdminGlobal
): FirebaseInitResult {
  moduleLogger.info(
    '[Firebase Admin Init] No existing app found by _handleExistingApp. Proceeding with new initialization.'
  );
  try {
    let appOrResult: admin.app.App | FirebaseInitResult;

    if (config.useEmulator) {
      appOrResult = _initializeForEmulator(config, appName);
    } else {
      appOrResult = _initializeWithCredentials(config, appName);
    }

    // Check if _initializeWithCredentials returned an error object
    if (appOrResult && 'error' in appOrResult && !('app' in appOrResult)) {
      return appOrResult as FirebaseInitResult;
    }

    // If we have an app object (not an error result from _initializeWithCredentials)
    const app = appOrResult as admin.app.App;
    return _finalizeInitialization(app, globalAdmin);
  } catch (error) {
    const safeConfig = safeConfigLogging(config);
    const errorMessage = error instanceof Error ? error.message : String(error);
    moduleLogger.error(
      { err: error, appNameAttempted: appName, configUsed: safeConfig },
      'Firebase Admin SDK new initialization attempt failed critically.'
    );
    return { error: `New initialization failed critically: ${errorMessage}` };
  }
}

export function initializeFirebaseAdmin(
  config: FirebaseAdminConfig,
  appName: string = UNIQUE_FIREBASE_ADMIN_APP_NAME
): FirebaseInitResult {
  const globalAdmin = firebaseAdminGlobal;
  moduleLogger.info(
    {
      receivedConfigUseEmulator: config.useEmulator,
      receivedConfigNodeEnv: config.nodeEnv,
      receivedConfigProjectId: config.projectId,
      appName,
      existingGlobalInstance: !!globalAdmin.appInstance,
    },
    '[Firebase Admin Init] initializeFirebaseAdmin called with config'
  );

  const existingAppResult = _handleExistingApp(appName, globalAdmin);
  if (existingAppResult) {
    return existingAppResult;
  }

  // If no existing app was handled, perform new initialization
  return _performNewInitialization(config, appName, globalAdmin);
}
