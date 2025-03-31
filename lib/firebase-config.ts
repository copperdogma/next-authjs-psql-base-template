// Import the functions you need from the SDKs you need
import { initializeApp } from '@firebase/app';
import { getApps, getApp } from '@firebase/app';

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

// Create a client-only implementation that will be properly initialized
if (typeof window !== 'undefined') {
  // Only initialize Firebase on the client side
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} else {
  // Provide placeholders for SSR context that won't be used
  firebaseApp = undefined;
}

export { firebaseApp };
