import { User } from 'firebase/auth';

// Create a mock user
export const mockUser = {
  displayName: 'Test User',
  email: 'test@example.com',
  uid: 'test-uid',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(() => Promise.resolve('mock-token')),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
} as unknown as User;

// Create a mock auth object
export const mockAuth = {
  currentUser: null as User | null,
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
};

// Mock app object
export const mockApp = {
  name: 'mock-app',
  options: {},
  automaticDataCollectionEnabled: false,
};

// Mock GoogleAuthProvider
export const mockGoogleAuthProvider = jest.fn().mockImplementation(() => ({
  addScope: jest.fn(),
  setCustomParameters: jest.fn(),
}));

// Mock Firebase auth functions
export const mockSignInWithPopup = jest.fn();
export const mockSignOut = jest.fn();

// Mock auth object
export const auth = {
  currentUser: null
};

// Mock app object
export const app = {};

// Mock Google Provider
export class GoogleAuthProvider {
  addScope() {
    return this;
  }
}

// Mock sign in function
export const signInWithPopup = jest.fn();

// Mock sign out function
export const signOut = jest.fn();

// Mock getAuth function
export const getAuth = jest.fn().mockReturnValue(auth); 