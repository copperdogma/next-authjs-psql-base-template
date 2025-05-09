import * as admin from 'firebase-admin';

export interface FirebaseAdminService {
  isInitialized(): boolean;
  getAuth(): admin.auth.Auth;
  getFirestore(): admin.firestore.Firestore;
  getStorage(): admin.storage.Storage;
  createUser(properties: admin.auth.CreateRequest): Promise<admin.auth.UserRecord>;
  updateUser(uid: string, properties: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord>;
  verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<admin.auth.DecodedIdToken>;
  createCustomToken(uid: string, developerClaims?: object): Promise<string>;
  getUser(uid: string): Promise<admin.auth.UserRecord>;
  getUserByEmail(email: string): Promise<admin.auth.UserRecord>;
  deleteUser(uid: string): Promise<void>;
  // Add other Firebase Admin SDK methods as needed
}
