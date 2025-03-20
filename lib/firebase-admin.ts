import * as admin from 'firebase-admin';

// Initialize Firebase Admin
function getFirebaseAdminApp(): admin.app.App {
  if (admin.apps.length === 0) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  return admin.apps[0] as admin.app.App;
}

const adminApp = getFirebaseAdminApp();
const adminAuth = admin.auth(adminApp);

export { adminApp, adminAuth }; 