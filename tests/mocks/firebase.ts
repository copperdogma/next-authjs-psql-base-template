import type { User } from '@firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// Function to generate random tokens/IDs to avoid test collisions
const generateToken = () => `mock-token-${uuidv4().slice(0, 8)}`;
const generateUid = () => `test-uid-${uuidv4().slice(0, 8)}`;

// Create a configurable mock user factory
export const createMockUser = (overrides = {}) => ({
  displayName: 'Test User',
  email: `test-${uuidv4().slice(0, 8)}@example.com`,
  uid: generateUid(),
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(() => Promise.resolve(generateToken())),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  ...overrides
} as unknown as User);

// Default mock user for backwards compatibility
export const mockUser = createMockUser();

// Create a configurable mock auth factory
export const createMockAuth = (overrides = {}) => ({
  currentUser: null as User | null,
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  ...overrides
});

// Default mock auth for backwards compatibility
export const mockAuth = createMockAuth();

// Mock app object with configurable options
export const createMockApp = (overrides = {}) => ({
  name: `mock-app-${uuidv4().slice(0, 8)}`,
  options: {},
  automaticDataCollectionEnabled: false,
  ...overrides
});

// Default mock app for backwards compatibility
export const mockApp = createMockApp();

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

// Mock sign in function that generates a dynamic token
export const signInWithPopup = jest.fn().mockImplementation(() => 
  Promise.resolve({ user: createMockUser() })
);

// Mock sign out function
export const signOut = jest.fn();

// Mock getAuth function
export const getAuth = jest.fn().mockReturnValue(auth); 