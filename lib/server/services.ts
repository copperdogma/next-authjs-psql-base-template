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

import { initializeFirebaseAdmin, getServerSideFirebaseAdminConfig } from '@/lib/firebase-admin';
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

async function _initializeFirebaseAdminApp(): Promise<boolean> {
  if (currentAdminApp) {
    return true; // Already initialized
  }

  try {
    const adminConfig = getServerSideFirebaseAdminConfig();
    const initResult = initializeFirebaseAdmin(adminConfig);

    const success = _handleFirebaseAdminInitResult(initResult);
    if (!success) {
      return false;
    }

    _logFirebaseAdminInitSuccess();
    _logFirebaseAdminInitWarning(initResult);

    return true;
  } catch (error) {
    setupLogger.error(
      { err: error },
      'Unexpected exception during Firebase Admin App initialization in services.ts'
    );
    currentAdminApp = undefined;
    return false;
  }
}

async function _initializeFirebaseAdminService(): Promise<boolean> {
  if (currentAdminApp && !firebaseAdminServiceInstance) {
    try {
      const serviceInstance = FirebaseAdminService.getInstance(
        setupLogger.child({ service: 'FirebaseAdminService' })
      );
      if (serviceInstance.isInitialized()) {
        firebaseAdminServiceInstance = serviceInstance;
        setupLogger.info('FirebaseAdminService initialized successfully in services.ts');
        return true;
      } else {
        setupLogger.warn(
          'FirebaseAdminService.getInstance was called, but service reported not initialized.'
        );
        return false;
      }
    } catch (error) {
      setupLogger.error(
        { err: error },
        'Failed to initialize FirebaseAdminService instance in services.ts'
      );
      return false;
    }
  }
  return !!firebaseAdminServiceInstance; // Already initialized or no admin app
}

async function initializeServicesIfNeeded(): Promise<void> {
  await initLock.acquire('service-initialization', async () => {
    if (servicesInitialized) {
      setupLogger.info('Services already initialized.');
      return;
    }

    const adminAppInitialized = await _initializeFirebaseAdminApp();
    if (!adminAppInitialized) {
      setupLogger.error(
        'Aborting further service initialization due to Firebase Admin App failure.'
      );
      return;
    }

    const adminServiceInitialized = await _initializeFirebaseAdminService();
    if (!adminServiceInitialized) {
      // setupLogger.error(
      //   'Aborting further service initialization due to Firebase Admin Service failure.'
      // ); // Removed this log as the final status log should cover it.
    }

    if (firebaseAdminServiceInstance && firebaseAdminServiceInstance.isInitialized()) {
      servicesInitialized = true;
      setupLogger.info('Core services marked as initialized.');
    } else {
      setupLogger.error(
        'Core services (specifically FirebaseAdminService) FAILED to initialize or Admin App failed. servicesInitialized remains false.'
      );
    }
  });
}

(async () => {
  await initializeServicesIfNeeded();
})();

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
