import { FirebaseAdminService } from '../interfaces/services';
import { getFirebaseAdmin } from '../firebase-admin';

/**
 * Implementation of FirebaseAdminService using Firebase Admin SDK
 */
export class DefaultFirebaseAdminService implements FirebaseAdminService {
  constructor() {}

  /**
   * Gets the Firebase Admin Auth instance
   */
  auth() {
    return getFirebaseAdmin().auth();
  }
}

// Create default instance
export const defaultFirebaseAdminService = new DefaultFirebaseAdminService();
