import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger'; // Assuming logger is available here

let app: admin.app.App;

/**
 * Initializes and returns the Firebase Admin SDK App instance (Singleton).
 * Uses environment variables for configuration.
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is not set in environment variables.');
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_CLIENT_EMAIL is not set in environment variables.');
  }
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables.');
  }

  const credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  try {
    logger.info('Initializing Firebase Admin SDK...');
    app = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      // databaseURL: `https://${credentials.projectId}.firebaseio.com` // Optional: if using Realtime Database
    });
    logger.info('Firebase Admin SDK initialized successfully.');
    return app;
  } catch (error) {
    logger.error({ err: error }, 'Firebase Admin SDK initialization failed');
    throw new Error('Could not initialize Firebase Admin SDK. Check server logs for details.');
  }
}

// Initialize on load (optional, alternative is to call getFirebaseAdminApp() when needed)
// getFirebaseAdminApp();
