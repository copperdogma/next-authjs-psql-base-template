// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth, connectAuthEmulator, Auth } from '@firebase/auth';
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

// Track emulator connection status to avoid double connections
let authEmulatorConnected = false;

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
 * Setup Firebase emulators when in development or test mode
 */
function setupEmulators(auth: Auth): void {
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

  // Initialize auth
  auth = getAuth(firebaseApp);

  // Connect to emulators if needed (Restored original logic)
  setupEmulators(auth);
} else {
  // Provide placeholders for SSR context that won't be used
  firebaseApp = undefined;
  auth = undefined;
}

export { firebaseApp, auth };
