// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth, connectAuthEmulator, Auth, signInWithEmailAndPassword } from '@firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from '@firebase/firestore';
import { logger } from '@/lib/logger'; // Import server logger
import { clientLogger } from '@/lib/client-logger'; // Import client logger

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * This file is imported by both server and client components.
 * We use this technique to handle Firebase initialization differently based on the environment.
 *
 * For server components: Empty objects are exported since Firebase client SDK cannot run on the server.
 * For client components: Proper Firebase instances are initialized and exported.
 */

// Initialize Firebase
let firebaseApp;
let auth;
let firestore;

// Track emulator connection status to avoid double connections
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

/**
 * Connect to Firebase Auth emulator if configured
 */
function connectToAuthEmulator(auth: Auth): void {
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || authEmulatorConnected) {
    return;
  }

  // Format: "localhost:9099"
  const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST.split(':');
  try {
    logger.info(`🔸 Connecting to Firebase Auth emulator at ${host}:${port}`);
    connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
    authEmulatorConnected = true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to Auth emulator');
  }
}

/**
 * Connect to Firestore emulator if configured
 */
function connectToFirestoreEmulator(firestore: Firestore): void {
  if (!process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || firestoreEmulatorConnected) {
    return;
  }

  // Format: "localhost:8080"
  const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
  try {
    logger.info(`🔸 Connecting to Firestore emulator at ${host}:${port}`);
    connectFirestoreEmulator(firestore, host, parseInt(port, 10));
    firestoreEmulatorConnected = true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to Firestore emulator');
  }
}

/**
 * Setup Firebase emulators when in development or test mode
 */
function setupEmulators(auth: Auth, firestore: Firestore): void {
  const shouldUseEmulator =
    process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

  // Use clientLogger.debug for verbose setup logs - Corrected argument order
  clientLogger.debug('[firebase-config] setupEmulators check', {
    shouldUseEmulator,
    envVar: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!shouldUseEmulator) {
    return;
  }

  connectToAuthEmulator(auth);
  connectToFirestoreEmulator(firestore);
  logger.info('🔸 Firebase emulator mode active');
}

// Create a client-only implementation that will be properly initialized
if (typeof window !== 'undefined') {
  // Use clientLogger.debug for initialization phase logs - Corrected argument order
  clientLogger.debug('[firebase-config] File loaded (client-side check)');
  clientLogger.debug('[firebase-config] Client-side init check', {
    envVar: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
  });

  // Only initialize Firebase on the client side
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Log NODE_ENV on the client using debug - Corrected argument order
  clientLogger.debug('[firebase-config] Client-side NODE_ENV', {
    nodeEnv: process.env.NODE_ENV,
  });

  // Initialize auth and firestore
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  // Connect to emulators if needed (Restored original logic)
  setupEmulators(auth, firestore);

  // Expose auth instance globally FOR TESTING ONLY (Restored original logic)
  // Use the dedicated E2E environment variable instead of NODE_ENV for client-side check
  if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV === 'true') {
    // Use debug for E2E specific logs
    clientLogger.debug(
      '[firebase-config] E2E test env detected, attempting to expose auth instance...'
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__firebaseAuthInstance__ = auth;
    // Expose the sign-in function as well
    clientLogger.debug('[firebase-config] Exposing signInWithEmailAndPassword function...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__signInWithEmailAndPassword__ = signInWithEmailAndPassword;
    logger.info('🧪 Exposed Firebase Auth instance and sign-in function to window for testing.');
  } else {
    // Optional: Log if not in E2E test env
    clientLogger.debug('[firebase-config] Not E2E test env, skipping auth instance exposure.');
  }
} else {
  // Provide placeholders for SSR context that won't be used
  firebaseApp = undefined;
  auth = undefined;
  firestore = undefined;
}

export { firebaseApp, auth, firestore };
