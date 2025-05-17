import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
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
const UNIQUE_FIREBASE_ADMIN_APP_NAME = '__NEXT_FIREBASE_ADMIN_APP_SINGLETON__';

// Symbol for global singleton pattern
const globalSymbol = Symbol.for('__FIREBASE_ADMIN_APP__');

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
  // Add other emulator hosts if needed (e.g., Firestore)
  // process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
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

export function initializeFirebaseAdmin(config: FirebaseAdminConfig): FirebaseInitResult {
  // 1. Check if already initialized and stored on global symbol
  if (firebaseAdminGlobal.appInstance) {
    moduleLogger.info(
      '[Firebase Admin Init] Using existing Firebase Admin app from global symbol: %s',
      firebaseAdminGlobal.appInstance.name
    );
    try {
      const auth = admin.auth(firebaseAdminGlobal.appInstance);
      return { app: firebaseAdminGlobal.appInstance, auth };
    } catch (e) {
      // Use the errorMessage variable
      const errorMessage = e instanceof Error ? e.message : String(e);
      moduleLogger.error(
        { err: e, message: errorMessage },
        'Failed to retrieve Auth service from existing initialized app.'
      );
      return {
        app: firebaseAdminGlobal.appInstance,
        error: `Failed to retrieve Auth service: ${errorMessage}`,
      };
    }
  }

  // 2. Check if Firebase SDK has our named app (e.g., after HMR that cleared global symbol)
  try {
    const existingNamedApp = admin.apps.find(app => app?.name === UNIQUE_FIREBASE_ADMIN_APP_NAME);
    if (existingNamedApp) {
      moduleLogger.warn(
        '[Firebase Admin Init] Found existing app by unique name in SDK. Using it and caching globally: %s',
        UNIQUE_FIREBASE_ADMIN_APP_NAME
      );
      firebaseAdminGlobal.appInstance = existingNamedApp; // Cache it globally
      const auth = admin.auth(existingNamedApp);
      return { app: existingNamedApp, auth };
    }
  } catch (error) {
    moduleLogger.error({ error }, 'Error looking for existing named app in admin.apps');
    // Fall through to attempt initialization
  }

  // 3. Validate config before attempting new initialization
  const validationError = validateConfig(config);
  if (validationError) {
    moduleLogger.error(
      '[Firebase Admin Init] Firebase Admin SDK not initialized due to config validation: %s',
      validationError
    );
    return { error: `Initialization failed: ${validationError}` };
  }

  // 4. Proceed with new initialization
  try {
    const appConfig: admin.AppOptions = {};
    if (config.useEmulator) {
      setupEmulator();
      // For emulator, projectId is often set directly in AppOptions or via env vars for discovery
      appConfig.projectId = config.projectId;
    } else {
      appConfig.credential = admin.credential.cert(createCredentials(config));
      // Ensure emulator host is not set if not using emulator
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    }

    moduleLogger.info(
      '[Firebase Admin Init] Initializing new Firebase Admin app: %s',
      UNIQUE_FIREBASE_ADMIN_APP_NAME
    );
    const newApp = admin.initializeApp(appConfig, UNIQUE_FIREBASE_ADMIN_APP_NAME);
    firebaseAdminGlobal.appInstance = newApp; // Store it globally

    const auth = admin.auth(newApp);
    moduleLogger.info(
      '[Firebase Admin Init] Firebase Admin SDK initialized successfully: %s',
      newApp.name
    );
    return { app: newApp, auth };
  } catch (initError: unknown) {
    const errorMsg = initError instanceof Error ? initError.message : String(initError);
    moduleLogger.error(
      { err: initError },
      '[Firebase Admin Init] Firebase Admin SDK initialization failed.'
    );
    firebaseAdminGlobal.appInstance = undefined; // Ensure it's clear on failure
    return { error: `Initialization failed: ${errorMsg}` };
  }
}

export function getFirebaseAdminApp(): admin.app.App | undefined {
  if (firebaseAdminGlobal.appInstance) {
    return firebaseAdminGlobal.appInstance;
  }
  // Attempt to recover if global symbol was missed but app exists in SDK
  try {
    const namedApp = admin.apps.find(app => app?.name === UNIQUE_FIREBASE_ADMIN_APP_NAME);
    if (namedApp) {
      moduleLogger.warn(
        '[getFirebaseAdminApp] Recovered app by unique name from SDK. Global symbol instance was missing. Caching it now globally.',
        { appName: UNIQUE_FIREBASE_ADMIN_APP_NAME }
      );
      firebaseAdminGlobal.appInstance = namedApp;
      return namedApp;
    }
  } catch (error) {
    moduleLogger.error(
      { error, appName: UNIQUE_FIREBASE_ADMIN_APP_NAME },
      '[getFirebaseAdminApp] Error occurred while trying to find named app from admin.apps registry.'
    );
  }
  moduleLogger.error(
    '[getFirebaseAdminApp] Firebase Admin app instance not found globally or by unique name in SDK registry. `initializeFirebaseAdmin` may have failed or was not called prior to this access.',
    { appName: UNIQUE_FIREBASE_ADMIN_APP_NAME }
  );
  return undefined;
}

export function getFirebaseAdminAuth(): admin.auth.Auth | undefined {
  const app = getFirebaseAdminApp();
  if (app) {
    try {
      return admin.auth(app);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      moduleLogger.error(
        { error: e, message: errorMsg },
        '[getFirebaseAdminAuth] Failed to get Firebase Auth service from app.'
      );
      // Potentially throw or return undefined based on how critical this is for consumers
      // For now, returning undefined, consumers must check.
      return undefined;
    }
  }
  moduleLogger.warn(
    '[getFirebaseAdminAuth] Could not get Firebase Admin app, so Auth service is unavailable.'
  );
  return undefined;
}

// Helper to get config, can be used by initializeFirebaseAdmin if called without explicit config
// For example, if lib/server/services.ts calls initializeFirebaseAdmin() without args.
export function getServerSideFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    // This config is critical, throw if not found.
    moduleLogger.error(
      'Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID for Firebase Admin SDK.'
    );
    throw new Error(
      'Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID for Firebase Admin SDK auto-init.'
    );
  }
  // In dev/test, prefer emulator if env var is set. In prod, never use emulator.
  const isProduction = process.env.NODE_ENV === 'production';
  const useEmulatorEnv =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
    process.env.USE_FIREBASE_EMULATOR === 'true';
  const useEmulator = !isProduction && useEmulatorEnv;

  // Credentials are required if not using emulator, or if in production (even if useEmulatorEnv was true by mistake)
  const requiresCredentials = !useEmulator || isProduction;

  return {
    projectId,
    clientEmail: requiresCredentials ? process.env.FIREBASE_CLIENT_EMAIL : null,
    privateKey: requiresCredentials ? process.env.FIREBASE_PRIVATE_KEY : null,
    useEmulator,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
