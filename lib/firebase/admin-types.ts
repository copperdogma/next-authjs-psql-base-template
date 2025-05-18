import * as admin from 'firebase-admin';

// Firebase Admin SDK specific types
export interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail?: string | null;
  privateKey?: string | null;
  useEmulator: boolean;
  nodeEnv: 'production' | 'development' | 'test' | string;
}

export interface FirebaseInitResult {
  app?: admin.app.App;
  auth?: admin.auth.Auth;
  error?: string;
}

// Used for managing singleton state
export const UNIQUE_FIREBASE_ADMIN_APP_NAME = '__NEXT_FIREBASE_ADMIN_APP__';

// Symbol for global singleton pattern
export const globalSymbol = Symbol.for('__NEXT_FIREBASE_ADMIN_APP_SINGLETON__');

export interface FirebaseAdminGlobal {
  appInstance?: admin.app.App;
}

// Type for global with our Firebase Admin global
export type GlobalWithFirebaseAdmin = typeof globalThis & {
  [globalSymbol]?: FirebaseAdminGlobal;
};
