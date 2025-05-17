/**
 * Centralized service initialization for server-side logic.
 * Ensures singletons and manages dependencies.
 * Consider dependency injection patterns for more complex scenarios.
 */

// import { PrismaClient } from '@prisma/client'; // Unused
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { UserService } from '@/lib/services/user-service';
import { ProfileService } from '@/lib/services/profile-service';
import { RawQueryServiceImpl } from '@/lib/services/raw-query-service';
// Import LoggerService interface and createApiLogger if needed, or just the base logger
// import { LoggerService } from '../interfaces/services'; // Unused
import { prisma } from '@/lib/prisma';
import { logger as rootLogger } from '@/lib/logger';
import {
  initializeFirebaseAdmin,
  getFirebaseAdminApp, // Import the getter instead of adminApp directly
  type FirebaseAdminConfig,
  // type FirebaseInitResult, // Unused
} from '@/lib/firebase-admin';

// --- Initialize Firebase Admin SDK ---
// This should only run once when the module is loaded.

// Read necessary environment variables
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Decode the base64 encoded private key if necessary, or handle escaped newlines
// Assuming the key is stored directly with escaped newlines for now
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const useEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || process.env.NODE_ENV === 'test';
const nodeEnv = process.env.NODE_ENV || 'development';

// Create the config object
const firebaseConfig: FirebaseAdminConfig = {
  projectId: firebaseProjectId || '', // Provide default empty string if undefined
  clientEmail: firebaseClientEmail, // Can be undefined/null
  privateKey: firebasePrivateKey, // Can be undefined/null
  useEmulator: useEmulator,
  nodeEnv: nodeEnv,
};

// Call the initialization function
// The initializeFirebaseAdmin function now updates the exported adminAuth and adminDb variables
initializeFirebaseAdmin(firebaseConfig);

// --- Instantiate Services ---
// Pass potentially undefined Firebase services to constructors
// The services themselves should handle cases where auth/db might be unavailable

// Logger for service setup itself
const setupLogger = rootLogger.child({ scope: 'service-init' });

// FirebaseAdminService requires the admin.app.App instance and a pino.Logger
const currentAdminApp = getFirebaseAdminApp(); // Call the getter

const firebaseAdminServiceInstance = currentAdminApp
  ? new FirebaseAdminService(currentAdminApp, setupLogger.child({ service: 'firebase-admin' }))
  : undefined;

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
