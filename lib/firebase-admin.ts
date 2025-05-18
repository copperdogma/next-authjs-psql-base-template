import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env'; // Added import
// import { logger } from './logger'; // Base logger for the app, if different from pino

// Create a module logger
const moduleLogger = logger.child({ module: 'firebase-admin' });

// Firebase Admin SDK specific types
export interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail?: string | null;
  privateKey?: string | null;
  useEmulator: boolean;
  nodeEnv: 'production' | 'development' | 'test' | string;
}

export interface FirebaseInitResult {
  app?: admin.app.App;
  auth?: admin.auth.Auth;
  error?: string;
}

// Used for managing singleton state
const UNIQUE_FIREBASE_ADMIN_APP_NAME = '__NEXT_FIREBASE_ADMIN_APP__';

// Symbol for global singleton pattern
const globalSymbol = Symbol.for('__NEXT_FIREBASE_ADMIN_APP_SINGLETON__');

interface FirebaseAdminGlobal {
  appInstance?: admin.app.App;
}

// Type for global with our Firebase Admin global
type GlobalWithFirebaseAdmin = typeof globalThis & {
  [globalSymbol]?: FirebaseAdminGlobal;
};

// Get global firebase admin or create initial empty object
const getFirebaseAdminGlobal = (): FirebaseAdminGlobal => {
  const global = globalThis as GlobalWithFirebaseAdmin;
  if (!global[globalSymbol]) {
    global[globalSymbol] = {};
  }
  return global[globalSymbol] as FirebaseAdminGlobal;
};

// Create a module-scoped reference to the global state
const firebaseAdminGlobal = getFirebaseAdminGlobal();

function validateConfig(config: FirebaseAdminConfig): string | null {
  if (config.nodeEnv !== 'production' && config.useEmulator) {
    return null; // Emulator doesn't need full creds
  }
  const requiredInProdOrNonEmulator: Array<keyof FirebaseAdminConfig> = [
    'clientEmail',
    'privateKey',
  ];
  for (const key of requiredInProdOrNonEmulator) {
    if (config[key]) {
      continue; // Key is present, check next one
    }

    // At this point, config[key] is missing.
    const message = `Missing Firebase Admin SDK config value for: ${key}`;

    // This check is now less nested.
    // In production, or in dev/test NOT using emulator, missing creds is an error.
    if (config.nodeEnv === 'production' || !config.useEmulator) {
      if (config.nodeEnv === 'production') {
        moduleLogger.error({ missingKey: key }, message);
      } else {
        // For non-production environments without emulator, log a warning
        moduleLogger.warn(
          { missingKey: key },
          `Non-production environment without emulator, but ${message}`
        );
      }
      return message; // Return error message to be packaged in FirebaseInitResult
    }
    // If it's dev/test AND useEmulator is true, missing creds here is fine.
  }
  return null;
}

function setupEmulator(): void {
  moduleLogger.info('[Firebase Admin Init] Configuring Firebase Admin SDK for EMULATOR use.');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; // Ensure this is also set for Firestore emulator
  // No longer need to delete GOOGLE_APPLICATION_CREDENTIALS here, it's done in getServerSideFirebaseAdminConfig
  // delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  // moduleLogger.info('[Firebase Admin Init] Unset GOOGLE_APPLICATION_CREDENTIALS for emulator mode.');
}

function createCredentials(config: FirebaseAdminConfig): FirebaseCredentials {
  if (!config.clientEmail || !config.privateKey) {
    // This should be caught by validateConfig, but as a safeguard:
    throw new Error('Client email and private key are required for credential creation.');
  }
  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey.replace(/\\n/g, '\n'),
  };
}

// Helper to try and get auth from an app, returns undefined on failure
function tryGetAuth(app: admin.app.App): admin.auth.Auth | undefined {
  try {
    return app.auth();
  } catch (e) {
    moduleLogger.error(
      { err: e, appName: app.name },
      'Failed to get auth from app instance during initialization result packaging.'
    );
    return undefined;
  }
}

// Helper to handle existing app scenarios
function _handleExistingApp(
  appName: string,
  globalAdmin: FirebaseAdminGlobal
): FirebaseInitResult | null {
  if (globalAdmin.appInstance && globalAdmin.appInstance.name === appName) {
    moduleLogger.info(
      `[Firebase Admin Init] Using existing Firebase Admin app from global symbol: ${String(globalSymbol)}`
    );
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
      { error: validationError, configUsed: 안전한_config_객체_로깅(config) },
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

    // Check if _initializeWithCredentials returned an error object, or if _initializeForEmulator threw and was caught by outer try-catch
    if (appOrResult && 'error' in appOrResult && !('app' in appOrResult)) {
      return appOrResult as FirebaseInitResult;
    }

    // If we have an app object (not an error result from _initializeWithCredentials)
    const app = appOrResult as admin.app.App;
    return _finalizeInitialization(app, globalAdmin);
  } catch (error) {
    // This catch block is primarily for errors from _initializeForEmulator or unexpected errors from _initializeWithCredentials
    // if it didn't return a FirebaseInitResult itself (e.g., if createCredentials threw directly).
    const safeConfig = 안전한_config_객체_로깅(config);
    const errorMessage = error instanceof Error ? error.message : String(error);
    moduleLogger.error(
      { err: error, appNameAttempted: appName, configUsed: safeConfig },
      'Firebase Admin SDK new initialization attempt failed critically within _performNewInitialization try/catch block.'
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

// Helper to log config safely (omitting sensitive fields if necessary, though privateKey is now undefined for emulator)
function 안전한_config_객체_로깅(config: FirebaseAdminConfig): Partial<FirebaseAdminConfig> {
  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail ? 'PRESENT' : 'ABSENT_OR_UNDEFINED',
    // privateKey: config.privateKey ? 'PRESENT' : 'ABSENT_OR_UNDEFINED', // Best not to log even presence of private key
    useEmulator: config.useEmulator,
    nodeEnv: config.nodeEnv,
  };
}

// MODIFIED: This function should ONLY get the app from the global symbol.
// It should NOT re-evaluate config or attempt to initialize.
// It now also tries to return the auth instance and any error during that process.
export function getFirebaseAdminApp(): FirebaseInitResult {
  moduleLogger.info(
    '[getFirebaseAdminApp] Attempting to retrieve app and auth from global symbol.'
  );

  const appInstance = firebaseAdminGlobal.appInstance;

  if (appInstance) {
    moduleLogger.info(
      `[getFirebaseAdminApp] Found app in global symbol: ${appInstance.name}. Attempting to get auth.`
    );
    const auth = tryGetAuth(appInstance);
    return auth
      ? { app: appInstance, auth }
      : { app: appInstance, error: 'Failed to retrieve auth from existing global app.' };
  }

  // Attempt recovery from admin.apps as a fallback if not found globally.
  moduleLogger.warn(
    '[getFirebaseAdminApp] Firebase Admin app instance not found via global symbol. Attempting SDK recovery.'
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
    '[getFirebaseAdminApp] Firebase Admin app instance not found globally or by unique name in SDK registry. `initializeFirebaseAdmin` may have failed or was not called prior to this access.',
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
      `[getFirebaseAdminAuth] App '${app.name}' was found, but its Auth service could not be retrieved (may have already been logged by getFirebaseAdminApp).`
    );
    return undefined;
  }
  if (!auth && !app) {
    moduleLogger.warn(
      '[getFirebaseAdminAuth] Neither App nor Auth service could be retrieved (may have already been logged by getFirebaseAdminApp).'
    );
    return undefined;
  }

  return auth; // Returns auth if successful, or undefined if any issue occurred (already logged)
}

// Helper to get config, can be used by initializeFirebaseAdmin if called without explicit config
// For example, if lib/server/services.ts calls initializeFirebaseAdmin() without args.
export function getServerSideFirebaseAdminConfig(): FirebaseAdminConfig {
  const nodeEnv = process.env.NODE_ENV;
  const useEmulatorPublicFlag = env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR; // Use validated boolean env var

  // Force emulator mode if the public flag is explicitly true, regardless of AUTH_EMULATOR_HOST for this decision logic.
  // AUTH_EMULATOR_HOST will still be set by setupEmulator() if this path is taken.
  const useEmulatorEnv = useEmulatorPublicFlag;
  // const authEmulatorHostSet = !!process.env.FIREBASE_AUTH_EMULATOR_HOST; // No longer part of useEmulatorEnv decision if public flag is source of truth
  // const useEmulatorEnv = useEmulatorPublicFlag || authEmulatorHostSet;

  let determinedProjectId = env.FIREBASE_PROJECT_ID; // Use validated env var
  let determinedClientEmail = env.FIREBASE_CLIENT_EMAIL; // Use validated env var
  let determinedPrivateKey = env.FIREBASE_PRIVATE_KEY; // Use validated env var

  // Add a check for projectId, as it's non-optional in FirebaseAdminConfig
  if (!determinedProjectId) {
    // This case should ideally not be reached if env validation is enforced,
    // but as a safeguard, especially for test environments where validation might be softer.
    const errorMessage =
      'FIREBASE_PROJECT_ID is missing in environment configuration. This is a required field.';
    moduleLogger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // If using emulator, effectively nullify credential-related fields for the config,
  // so that credential validation is skipped and SDK relies on emulator hosts.
  if (useEmulatorEnv) {
    moduleLogger.info(
      '[Firebase Admin Config] Emulator mode forced by NEXT_PUBLIC_USE_FIREBASE_EMULATOR or FIREBASE_AUTH_EMULATOR_HOST. ' +
        'Credential-related env vars will be ignored for config purposes.'
    );
    determinedClientEmail = undefined;
    determinedPrivateKey = undefined;
    // GOOGLE_APPLICATION_CREDENTIALS should also be deleted from process.env to prevent SDK auto-loading
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      moduleLogger.info(
        '[Firebase Admin Config] Deleted GOOGLE_APPLICATION_CREDENTIALS from process.env for emulator mode.'
      );
    }
  }

  // Log determined values before returning config
  moduleLogger.info(
    {
      determinedProjectId,
      determinedClientEmailIsPresent: !!determinedClientEmail,
      determinedPrivateKeyIsPresent: !!determinedPrivateKey,
      determinedUseEmulator: useEmulatorEnv,
      determinedNodeEnv: nodeEnv,
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR_ENV: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR, // Keep for logging raw value if needed
      FIREBASE_AUTH_EMULATOR_HOST_ENV: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    },
    'getServerSideFirebaseAdminConfig: Determined config values'
  );

  return {
    projectId: determinedProjectId, // Now guaranteed to be a string by the check above
    clientEmail: determinedClientEmail, // string | undefined from env, compatible with string | null | undefined
    privateKey: determinedPrivateKey, // string | undefined from env, compatible with string | null | undefined
    useEmulator: useEmulatorEnv,
    nodeEnv: nodeEnv || 'development',
  };
}
