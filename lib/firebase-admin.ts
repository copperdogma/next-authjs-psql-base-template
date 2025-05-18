/**
 * Firebase Admin SDK module
 * This file re-exports functionality from more specialized modules
 * to maintain backwards compatibility
 */

// Export types
export type {
  FirebaseCredentials,
  FirebaseAdminConfig,
  FirebaseInitResult,
  FirebaseAdminGlobal,
  GlobalWithFirebaseAdmin,
} from './firebase/admin-types';

// Export constants
export { UNIQUE_FIREBASE_ADMIN_APP_NAME } from './firebase/admin-types';

// Export utilities
export {
  getFirebaseAdminGlobal,
  validateConfig,
  setupEmulator,
  createCredentials,
  tryGetAuth,
  safeConfigLogging,
} from './firebase/admin-utils';

// Export initialization
export { initializeFirebaseAdmin } from './firebase/admin-initialization';

// Export access functions
export { getFirebaseAdminApp, getFirebaseAdminAuth } from './firebase/admin-access';

// Export configuration
export { getServerSideFirebaseAdminConfig } from './firebase/admin-config';
