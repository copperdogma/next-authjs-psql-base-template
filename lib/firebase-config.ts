// Import the functions you need from the SDKs you need
import { initializeApp } from '@firebase/app';
import { getApps, getApp } from '@firebase/app';
import { connectAuthEmulator, getAuth } from '@firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@firebase/firestore';

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

// Create a client-only implementation that will be properly initialized
if (typeof window !== 'undefined') {
  // Only initialize Firebase on the client side
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize auth and firestore
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  // Connect to emulators when in test or development mode with emulator env vars
  if (
    (process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') &&
    typeof window !== 'undefined'
  ) {
    // Check if AUTH emulator host is set
    if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && !authEmulatorConnected) {
      // Format: "localhost:9099"
      const [host, port] = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST.split(':');
      try {
        console.log(`🔸 Connecting to Firebase Auth emulator at ${host}:${port}`);
        connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
        authEmulatorConnected = true;
      } catch (error) {
        console.error('Failed to connect to Auth emulator:', error);
      }
    }

    // Check if Firestore emulator host is set
    if (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST && !firestoreEmulatorConnected) {
      // Format: "localhost:8080"
      const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
      try {
        console.log(`🔸 Connecting to Firestore emulator at ${host}:${port}`);
        connectFirestoreEmulator(firestore, host, parseInt(port, 10));
        firestoreEmulatorConnected = true;
      } catch (error) {
        console.error('Failed to connect to Firestore emulator:', error);
      }
    }

    console.log('🔸 Firebase emulator mode active');
  }
} else {
  // Provide placeholders for SSR context that won't be used
  firebaseApp = undefined;
  auth = undefined;
  firestore = undefined;
}

export { firebaseApp, auth, firestore };
