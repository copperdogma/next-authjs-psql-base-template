import type { User as FirebaseUser } from '@firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { jest } from '@jest/globals';

// Function to generate random tokens/IDs to avoid test collisions
const generateToken = () => `mock-token-${uuidv4().slice(0, 8)}`;
const generateUid = () => `test-uid-${uuidv4().slice(0, 8)}`;

// --- User Mock --- //
export const createMockFirebaseUser = (overrides = {}): FirebaseUser =>
  ({
    displayName: 'Test User',
    email: `test-${uuidv4().slice(0, 8)}@example.com`,
    uid: generateUid(),
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn(() => Promise.resolve()),
    getIdToken: jest.fn(() => Promise.resolve(generateToken())),
    getIdTokenResult: jest.fn(() =>
      Promise.resolve({
        token: generateToken(),
        expirationTime: 'mock-exp-time',
        authTime: 'mock-auth-time',
        issuedAtTime: 'mock-issued-time',
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
      })
    ),
    reload: jest.fn(() => Promise.resolve()),
    toJSON: jest.fn(() => ({ uid: generateUid(), email: 'test@example.com' })),
    ...overrides,
  }) as unknown as FirebaseUser; // Using unknown as User from '@firebase/auth' can be complex to fully type for a mock

export const mockFirebaseUser = createMockFirebaseUser();

// --- Auth Service Mock --- //
export const createMockAuth = (currentUser: FirebaseUser | null = null) => ({
  currentUser,
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback: (user: FirebaseUser | null) => void) => {
    // Immediately invoke with current user, then return unsubscribe function
    Promise.resolve().then(() => callback(currentUser)); // Simulate async nature
    return jest.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn((email, _password) =>
    Promise.resolve({ user: createMockFirebaseUser({ email }) })
  ),
  createUserWithEmailAndPassword: jest.fn((email, _password) =>
    Promise.resolve({ user: createMockFirebaseUser({ email }) })
  ),
  signInWithPopup: jest.fn((_provider: any) => Promise.resolve({ user: createMockFirebaseUser() })),
  // Add other methods if commonly used and need specific mock implementations
});

// Default mock auth instance (can be customized by tests if needed)
let defaultMockAuthInstance = createMockAuth(null); // Initially no user

// --- Top-level Firebase SDK Function Mocks --- //
export const getAuth = jest.fn(() => defaultMockAuthInstance);

export const signInWithPopup = jest.fn((_auth, _provider) => {
  // Simulate successful sign-in and update the defaultMockAuthInstance's currentUser
  const user = createMockFirebaseUser();
  defaultMockAuthInstance = createMockAuth(user); // Update the instance getAuth returns
  // Return the standard UserCredential structure
  return Promise.resolve({ user });
});

export const signOut = jest.fn(_auth => {
  defaultMockAuthInstance = createMockAuth(null); // Reset user on sign out
  return Promise.resolve();
});

// --- Providers --- //
export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
  providerId = GoogleAuthProvider.PROVIDER_ID;
  constructor() {
    // Mock common methods if needed, or leave as is if only instantiation is important
  }
  addScope = jest.fn().mockReturnThis();
  setCustomParameters = jest.fn().mockReturnThis();
}

// Helper to reset the state of the default mock auth instance for test isolation
export const resetFirebaseClientMocks = () => {
  defaultMockAuthInstance = createMockAuth(null);
  // Clear all mock function call histories and implementations
  getAuth.mockClear().mockReturnValue(defaultMockAuthInstance);
  signInWithPopup.mockClear().mockImplementation((_auth, _provider) => {
    const user = createMockFirebaseUser();
    defaultMockAuthInstance = createMockAuth(user);
    return Promise.resolve({ user });
  });
  signOut.mockClear().mockImplementation(_auth => {
    defaultMockAuthInstance = createMockAuth(null);
    return Promise.resolve();
  });
  // Potentially reset createMockFirebaseUser if it maintains internal state, but it doesn't seem to.
  // Reset GoogleAuthProvider mocks if necessary, though they are class-based here.
};
