import * as admin from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if app is already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      // Initialize app with service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });

      // Connect to emulators when in test mode or when explicitly configured
      if (process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true') {
        // Configure Auth emulator if host is specified
        if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
          console.log(
            `🔸 [Admin SDK] Using Firebase Auth emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
          );
        }

        // Configure Firestore emulator if host is specified
        if (process.env.FIRESTORE_EMULATOR_HOST) {
          process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
          console.log(
            `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
          );
        }

        console.log('🔸 [Admin SDK] Firebase emulator mode active');
      }

      console.log('Firebase Admin SDK initialized successfully');
    }

    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

// Initialize Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

// Export the admin instance and auth module for use in other files
export const auth = firebaseAdmin.auth();
export default firebaseAdmin;
