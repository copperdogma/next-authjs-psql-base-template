import * as admin from 'firebase-admin';
import serviceAccountKeyJson from '@/secrets/ai-calendar-helper-20a931a08b89.json';

let app: admin.app.App;

// Cast the imported JSON to the ServiceAccount type
const serviceAccount = serviceAccountKeyJson as admin.ServiceAccount;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add other Firebase config like databaseURL or storageBucket if needed by your app
      // projectId: serviceAccount.project_id, // Usually inferred from service account
    });
    console.log('[Firebase Admin Init] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[Firebase Admin Init] Firebase Admin SDK initialization error:', error);
    // Depending on the application's needs, you might want to throw the error
    // or handle it in a way that allows the app to run in a degraded state.
    // For now, we'll let `app` be potentially undefined and let consumers handle it.
    // However, in most cases, a failed initialization is critical.
    throw new Error(
      `Firebase Admin SDK failed to initialize: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} else {
  app = admin.app(); // Get default app if already initialized
  console.log('[Firebase Admin Init] Firebase Admin SDK already initialized. Using default app.');
}

export { app as firebaseAdminApp };
