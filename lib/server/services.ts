/**
 * Centralized service initialization for server-side logic.
 * Ensures singletons and manages dependencies.
 * Consider dependency injection patterns for more complex scenarios.
 */

import { PrismaClient } from '@prisma/client'; // Assuming Prisma is used
import { Redis } from 'ioredis'; // Assuming ioredis is used for RedisService, or similar
import * as admin from 'firebase-admin';
// @ts-expect-error AsyncLock types are not available but the package works correctly
import AsyncLock from 'async-lock';

import {
  initializeFirebaseAdmin,
  getServerSideFirebaseAdminConfig,
  FirebaseAdminConfig,
} from '@/lib/firebase-admin';
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
// Import or define RedisService if used
// import { RedisService } from '@/lib/services/redis-service';
import { logger as rootLogger } from '@/lib/logger';
import { UserService } from '@/lib/services/user-service';
import { ProfileService } from '@/lib/services/profile-service';
import { RawQueryServiceImpl } from '@/lib/services/raw-query-service';
import { prisma } from '@/lib/prisma';

const setupLogger = rootLogger.child({ module: 'services-setup' });

// Module-level service instances, initialized once
let currentAdminApp: admin.app.App | undefined = undefined;
let firebaseAdminServiceInstance: FirebaseAdminService | null = null;
let prismaClient: PrismaClient | null = null; // Declare prismaClient
let redisService: Redis | null = null; // Declare redisService (adjust type as needed)
let servicesInitialized = false; // Declare servicesInitialized

const initLock = new AsyncLock();

// Helper for Firebase admin app initialization result handling
function _handleFirebaseAdminInitResult(initResult: {
  error?: string;
  app?: admin.app.App;
}): boolean {
  if (initResult.error && !initResult.app) {
    setupLogger.error(
      { error: initResult.error },
      'Failed to initialize Firebase Admin App in services.ts (returned error).'
    );
    currentAdminApp = undefined;
    return false;
  }

  if (!initResult.app) {
    setupLogger.error(
      'Firebase Admin App was not assigned (app undefined in result) after calling initializeFirebaseAdmin.'
    );
    currentAdminApp = undefined;
    return false;
  }

  currentAdminApp = initResult.app;
  return true;
}

// Log success for Firebase admin app initialization
function _logFirebaseAdminInitSuccess(): void {
  if (currentAdminApp) {
    setupLogger.info(
      { appName: currentAdminApp.name },
      'Firebase Admin App successfully initialized and assigned in services.ts'
    );
  }
}

// Log warning for Firebase admin app initialization
function _logFirebaseAdminInitWarning(initResult: { error?: string; app?: admin.app.App }): void {
  if (initResult.error && currentAdminApp) {
    setupLogger.warn(
      { appName: currentAdminApp.name, error: initResult.error },
      'Firebase Admin App initialized, but an associated error was reported (e.g., auth retrieval failure).'
    );
  }
}

// Helper for Firebase admin app initialization steps 3 & 4
function _performFirebaseAppInitialization(adminConfig: FirebaseAdminConfig): boolean {
  const initResult = initializeFirebaseAdmin(adminConfig);
  const success = _handleFirebaseAdminInitResult(initResult);
  if (!success) {
    return false;
  }
  // At this point, currentAdminApp should be valid if success is true
  if (!currentAdminApp) {
    setupLogger.error(
      'Firebase Admin App is undefined after successful _handleFirebaseAdminInitResult in _performFirebaseAppInitialization. This should not happen.'
    );
    return false;
  }
  _logFirebaseAdminInitSuccess();
  _logFirebaseAdminInitWarning(initResult);
  return true;
}

async function _initializeFirebaseAdminApp(): Promise<boolean> {
  if (currentAdminApp) {
    setupLogger.info(
      { appName: currentAdminApp.name },
      'Firebase Admin App already initialized and available in services.ts'
    );
    return true;
  }

  try {
    const adminConfig = getServerSideFirebaseAdminConfig();
    return _performFirebaseAppInitialization(adminConfig);
  } catch (error) {
    setupLogger.error(
      { err: error },
      'Unexpected exception during Firebase Admin App initialization in services.ts'
    );
    currentAdminApp = undefined;
    return false;
  }
}

// Helper for FirebaseAdminService initialization steps 3 & 4
// eslint-disable-next-line max-statements
function _createAndSetFirebaseAdminServiceInstance(): boolean {
  // Explicit check to satisfy linter and for robustness, though currentAdminApp should be validated by the caller
  if (!currentAdminApp) {
    setupLogger.error(
      'CRITICAL: _createAndSetFirebaseAdminServiceInstance called but currentAdminApp is null. This should have been caught by the caller.'
    );
    return false;
  }
  try {
    const serviceLogger = setupLogger.child({ service: 'FirebaseAdminService' });
    const serviceInstance = FirebaseAdminService.getInstance(currentAdminApp, serviceLogger);

    if (serviceInstance.isInitialized()) {
      firebaseAdminServiceInstance = serviceInstance;
      setupLogger.info('FirebaseAdminService initialized successfully in services.ts');
      return true;
    }

    // If not initialized:
    setupLogger.warn(
      'FirebaseAdminService.getInstance was called, but service reported not initialized.'
    );
    firebaseAdminServiceInstance = null;
    return false;
  } catch (error) {
    setupLogger.error(
      { err: error },
      'Failed to initialize FirebaseAdminService instance in services.ts'
    );
    firebaseAdminServiceInstance = null;
    return false;
  }
}

function _initializeFirebaseAdminService(): boolean {
  if (!currentAdminApp) {
    setupLogger.warn(
      'Attempted to initialize FirebaseAdminService, but Firebase Admin App is not available. Skipping.'
    );
    return false;
  }

  if (firebaseAdminServiceInstance) {
    return true; // Already initialized
  }

  return _createAndSetFirebaseAdminServiceInstance();
}

async function initializeServicesIfNeeded(): Promise<void> {
  await initLock.acquire('service-initialization', async () => {
    if (servicesInitialized) {
      setupLogger.info('Services already initialized.');
      return;
    }

    // Step 1: Initialize Firebase Admin App (this remains async)
    const adminAppInitialized = await _initializeFirebaseAdminApp();
    if (!adminAppInitialized || !currentAdminApp) {
      // Also check currentAdminApp directly
      setupLogger.error(
        'Aborting further service initialization due to Firebase Admin App failure or unavailability.'
      );
      return;
    }

    // Step 2: Initialize Firebase Admin Service (now synchronous, depends on currentAdminApp)
    // This call happens *after* currentAdminApp is confirmed to be initialized.
    const adminServiceInitialized = _initializeFirebaseAdminService();
    // No need to abort here if adminService fails, as other services might not depend on it.
    // The final log will indicate its status.

    // servicesInitialized can be set to true if at least the app is up,
    // specific services can be checked for their availability.
    // Or, if FirebaseAdminService is critical, keep this logic.
    // For this refactor, we'll assume FirebaseAdminService is critical for "servicesInitialized"
    if (
      adminServiceInitialized &&
      firebaseAdminServiceInstance &&
      firebaseAdminServiceInstance.isInitialized()
    ) {
      servicesInitialized = true;
      setupLogger.info('Core services (including FirebaseAdminService) marked as initialized.');
    } else {
      setupLogger.error(
        'Core services FAILED to initialize (specifically FirebaseAdminService or its prerequisite Admin App). servicesInitialized remains false.'
      );
    }
  });
}

// Only auto-initialize if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await initializeServicesIfNeeded();
  })();
}

export async function getFirebaseAdminService(): Promise<FirebaseAdminService | null> {
  await initializeServicesIfNeeded();

  if (!firebaseAdminServiceInstance || !firebaseAdminServiceInstance.isInitialized()) {
    setupLogger.error(
      'getFirebaseAdminService: FirebaseAdminService is still not initialized after awaiting initializeServicesIfNeeded. Returning null.'
    );
    return null;
  }
  return firebaseAdminServiceInstance;
}

// Similarly for Prisma and Redis if they follow async initialization or need guarding
export async function getPrismaClient(): Promise<PrismaClient | null> {
  await initializeServicesIfNeeded(); // Ensure services (including Prisma) are attempted
  if (!prismaClient) {
    setupLogger.warn('getPrismaClient: PrismaClient is not initialized. Returning null.');
  }
  return prismaClient;
}

// Note: Adjust RedisService type and initialization as per actual implementation
export async function getRedisService(): Promise<Redis | null> {
  await initializeServicesIfNeeded(); // Ensure services (including Redis) are attempted
  if (!redisService) {
    setupLogger.warn('getRedisService: RedisService is not initialized. Returning null.');
  }
  return redisService;
}

// Instantiate RawQueryService implementation
// It expects PrismaClient and pino.Logger now
const rawQueryServiceInstance = new RawQueryServiceImpl(
  prisma,
  setupLogger.child({ service: 'raw-query' }) // No cast needed
);

// Instantiate UserService (expects PrismaClient and pino.Logger)
const userServiceInstance = new UserService(prisma, setupLogger.child({ service: 'user' }));

// Instantiate ProfileService, checking dependencies
// Expects UserService, FirebaseAdminService, and pino.Logger
const profileServiceInstance =
  firebaseAdminServiceInstance && userServiceInstance
    ? new ProfileService(
        userServiceInstance, // Pass the created UserService instance
        firebaseAdminServiceInstance,
        setupLogger.child({ service: 'profile' }) // Pass pino logger instance
      )
    : undefined;

// Export a base logger instance for general API use
// LoggerService is an interface, export the pino instance that implements it
const apiLoggerServiceInstance = rootLogger.child({ service: 'api' }); // This is a pino instance

// Log final status
if (!firebaseAdminServiceInstance) {
  rootLogger.warn(
    'Firebase Admin Service could not be initialized (Firebase Admin SDK likely failed/skipped init). Services depending on it (e.g., ProfileService) will be unavailable.'
  );
} else {
  rootLogger.info('Server services initialized.');
}

// --- Export Services ---
export const firebaseAdminService = firebaseAdminServiceInstance;
export const userService = userServiceInstance;
export const profileService = profileServiceInstance;
export const rawQueryService = rawQueryServiceInstance;
export const apiLoggerService = apiLoggerServiceInstance;

export { setupLogger as appLogger };
