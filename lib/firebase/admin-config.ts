import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { FirebaseAdminConfig } from './admin-types';

// Create a module logger
const moduleLogger = logger.child({ module: 'firebase-admin-config' });

/**
 * Validates and retrieves the required Firebase project ID
 */
function getValidatedProjectId(): string {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    const errorMessage =
      'FIREBASE_PROJECT_ID is missing in environment configuration. This is a required field.';
    moduleLogger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return projectId;
}

/**
 * Handles emulator configuration and returns credential values
 */
function configureEmulatorSettings(useEmulator: boolean): {
  clientEmail: string | undefined;
  privateKey: string | undefined;
} {
  let clientEmail = env.FIREBASE_CLIENT_EMAIL;
  let privateKey = env.FIREBASE_PRIVATE_KEY;

  if (useEmulator) {
    moduleLogger.info(
      '[Firebase Admin Config] Emulator mode enabled. Credential-related env vars will be ignored.'
    );
    clientEmail = undefined;
    privateKey = undefined;

    // Delete GOOGLE_APPLICATION_CREDENTIALS to prevent SDK auto-loading
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      moduleLogger.info(
        '[Firebase Admin Config] Deleted GOOGLE_APPLICATION_CREDENTIALS for emulator mode.'
      );
    }
  }

  return { clientEmail, privateKey };
}

/**
 * Logs the determined configuration values
 */
function logConfigValues(config: Partial<FirebaseAdminConfig>): void {
  moduleLogger.info(
    {
      determinedProjectId: config.projectId,
      determinedClientEmailIsPresent: !!config.clientEmail,
      determinedPrivateKeyIsPresent: !!config.privateKey,
      determinedUseEmulator: config.useEmulator,
      determinedNodeEnv: config.nodeEnv,
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR_ENV: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
      FIREBASE_AUTH_EMULATOR_HOST_ENV: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    },
    'getServerSideFirebaseAdminConfig: Determined config values'
  );
}

// Helper to get config, can be used by initializeFirebaseAdmin if called without explicit config
export function getServerSideFirebaseAdminConfig(): FirebaseAdminConfig {
  const nodeEnv = process.env.NODE_ENV;
  const useEmulatorEnv = env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR;

  // Get validated project ID
  const projectId = getValidatedProjectId();

  // Configure credentials based on emulator settings
  const { clientEmail, privateKey } = configureEmulatorSettings(useEmulatorEnv);

  // Create the final config object
  const config: FirebaseAdminConfig = {
    projectId,
    clientEmail,
    privateKey,
    useEmulator: useEmulatorEnv,
    nodeEnv: nodeEnv || 'development',
  };

  // Log the determined values
  logConfigValues(config);

  return config;
}
