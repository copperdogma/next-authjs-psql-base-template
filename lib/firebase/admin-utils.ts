import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import {
  FirebaseAdminConfig,
  FirebaseCredentials,
  FirebaseAdminGlobal,
  GlobalWithFirebaseAdmin,
  globalSymbol,
} from './admin-types';

// Create a module logger
const moduleLogger = logger.child({ module: 'firebase-admin-utils' });

// Get global firebase admin or create initial empty object
export const getFirebaseAdminGlobal = (): FirebaseAdminGlobal => {
  const global = globalThis as GlobalWithFirebaseAdmin;
  if (!global[globalSymbol]) {
    global[globalSymbol] = {};
  }
  return global[globalSymbol] as FirebaseAdminGlobal;
};

export function validateConfig(config: FirebaseAdminConfig): string | null {
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

export function setupEmulator(): void {
  moduleLogger.info('[Firebase Admin Init] Configuring Firebase Admin SDK for EMULATOR use.');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; // Ensure this is also set for Firestore emulator
}

export function createCredentials(config: FirebaseAdminConfig): FirebaseCredentials {
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
export function tryGetAuth(app: admin.app.App): admin.auth.Auth | undefined {
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

// Helper to log config safely (omitting sensitive fields if necessary)
export function safeConfigLogging(config: FirebaseAdminConfig): Partial<FirebaseAdminConfig> {
  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail ? 'PRESENT' : 'ABSENT_OR_UNDEFINED',
    useEmulator: config.useEmulator,
    nodeEnv: config.nodeEnv,
  };
}
