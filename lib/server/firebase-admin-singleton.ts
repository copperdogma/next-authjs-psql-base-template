import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { logger as rootLogger } from '@/lib/logger';
import { firebaseAdminApp } from './firebase-admin-init'; // Import the initialized app

// Create a logger specific for this singleton's operations if needed, or use a general one.
const singletonInstanceLogger = rootLogger.child({ service: 'FirebaseAdminSingleton' });

let instance: FirebaseAdminService;

if (firebaseAdminApp) {
  instance = new FirebaseAdminService(firebaseAdminApp, singletonInstanceLogger);
} else {
  // Handle the case where firebaseAdminApp might not be initialized (though firebase-admin-init throws)
  // This path should ideally not be hit if firebase-admin-init.ts throws on failure.
  singletonInstanceLogger.fatal(
    'Firebase Admin App was not initialized. FirebaseAdminService singleton cannot be created.'
  );
  // Depending on strictness, could throw here or allow `instance` to be undefined,
  // forcing consumers to check. Throwing is safer to prevent runtime errors later.
  throw new Error(
    'FirebaseAdminService singleton cannot be created due to Firebase Admin App initialization failure.'
  );
}

const firebaseAdminServiceImpl = instance;

/**
 * Helper to check if the Firebase Admin SDK seems ready through our service instance.
 * The FirebaseAdminService constructor handles initialization. If it didn't throw,
 * we assume it's ready. This function primarily checks if the service instance itself is available.
 */
function isFirebaseAdminServiceReady(): boolean {
  // Check if the app instance is valid and has a name (basic check for initialization)
  return !!(firebaseAdminApp && firebaseAdminApp.name && firebaseAdminServiceImpl);
}

export {
  firebaseAdminServiceImpl,
  isFirebaseAdminServiceReady, // Exporting this if other parts of the code rely on an isInitialized check pattern
};
