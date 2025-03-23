// Import the functions you need from the SDKs you need
import { initializeApp } from '@firebase/app';
import { getApps, getApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import type { Auth } from '@firebase/auth';

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
 *
 * Each consumer component should check if they're running on the client with isFirebaseAuth()
 * before attempting to use Firebase methods.
 */

// Initialize Firebase
let firebaseApp;
let auth: Auth | Record<string, never>;

// Create a client-only implementation that will be properly initialized
if (typeof window !== 'undefined') {
  // Only initialize Firebase on the client side
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(firebaseApp);
} else {
  // Provide placeholders for SSR context that won't be used
  auth = {};
  firebaseApp = undefined;
}

// Type guard function to check if auth is a Firebase Auth instance
export function isFirebaseAuth(auth: Auth | Record<string, never>): auth is Auth {
  return typeof window !== 'undefined' && Object.keys(auth).length > 0;
}

export { auth, firebaseApp };
