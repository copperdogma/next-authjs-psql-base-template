/**
 * Firebase mocking utilities for tests
 *
 * This file provides standardized mocks for Firebase client and admin SDKs.
 * Use these utilities to create consistent mocks across test files.
 */

// Mock user data
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: 'https://example.com/photo.jpg',
  metadata: {
    creationTime: '2023-01-01T00:00:00Z',
    lastSignInTime: '2023-01-02T00:00:00Z',
  },
};

// Mock ID token
export const mockIdToken = 'mock-id-token-for-testing';

// Mock session cookie
export const mockSessionCookie = 'mock-session-cookie-for-testing';

// Firebase Client SDK mock creator
export const createFirebaseClientMocks = () => {
  // Mock for auth state changes (null for signed out, mockUser for signed in)
  const authStateChangeMock = jest.fn();
  // Mock for sign in with popup
  const signInWithPopupMock = jest.fn();
  // Mock for sign out
  const signOutMock = jest.fn();
  // Mock for get ID token
  const getIdTokenMock = jest.fn();

  // Configure default implementations
  authStateChangeMock.mockImplementation(callback => {
    // Simulate an auth state change event with user data
    callback(mockUser);
    // Return unsubscribe function
    return jest.fn();
  });

  signInWithPopupMock.mockResolvedValue({
    user: mockUser,
    credential: {
      accessToken: 'mock-access-token',
    },
  });

  signOutMock.mockResolvedValue(undefined);

  getIdTokenMock.mockResolvedValue(mockIdToken);

  // The complete mock object to return
  return {
    // Mock functions
    authStateChangeMock,
    signInWithPopupMock,
    signOutMock,
    getIdTokenMock,

    // Setup function for firebase/auth
    setupFirebaseAuthMock: () => {
      jest.mock('firebase/auth', () => {
        const mockAuth = {
          currentUser: mockUser,
          onAuthStateChanged: authStateChangeMock,
        };

        return {
          getAuth: jest.fn(() => mockAuth),
          signInWithPopup: signInWithPopupMock,
          signOut: signOutMock,
          GoogleAuthProvider: jest.fn(() => ({ addScope: jest.fn() })),
          onAuthStateChanged: authStateChangeMock,
        };
      });
    },
  };
};

// Firebase Admin SDK mock creator
export const createFirebaseAdminMocks = () => {
  // Mock for verify ID token
  const verifyIdTokenMock = jest.fn();
  // Mock for create session cookie
  const createSessionCookieMock = jest.fn();
  // Mock for verify session cookie
  const verifySessionCookieMock = jest.fn();
  // Mock for revoke refresh tokens
  const revokeRefreshTokensMock = jest.fn();
  // Mock for get user
  const getUserMock = jest.fn();

  // Configure default implementations
  verifyIdTokenMock.mockResolvedValue({
    uid: mockUser.uid,
    email: mockUser.email,
    email_verified: mockUser.emailVerified,
  });

  createSessionCookieMock.mockResolvedValue(mockSessionCookie);

  verifySessionCookieMock.mockResolvedValue({
    uid: mockUser.uid,
    email: mockUser.email,
    email_verified: mockUser.emailVerified,
  });

  revokeRefreshTokensMock.mockResolvedValue(undefined);

  getUserMock.mockResolvedValue(mockUser);

  // The complete mock object to return
  return {
    // Mock functions
    verifyIdTokenMock,
    createSessionCookieMock,
    verifySessionCookieMock,
    revokeRefreshTokensMock,
    getUserMock,

    // Setup function for firebase-admin
    setupFirebaseAdminMock: () => {
      jest.mock('firebase-admin', () => {
        const authMock = jest.fn(() => ({
          verifyIdToken: verifyIdTokenMock,
          createSessionCookie: createSessionCookieMock,
          verifySessionCookie: verifySessionCookieMock,
          revokeRefreshTokens: revokeRefreshTokensMock,
          getUser: getUserMock,
        }));

        return {
          credential: {
            cert: jest.fn().mockReturnValue({}),
          },
          initializeApp: jest.fn(),
          apps: [],
          auth: authMock,
        };
      });
    },
  };
};

// Export a commonly used object with both client and admin mocks initialized
export const createFirebaseMocks = () => {
  const clientMocks = createFirebaseClientMocks();
  const adminMocks = createFirebaseAdminMocks();

  return {
    ...clientMocks,
    ...adminMocks,
    setupAllFirebaseMocks: () => {
      clientMocks.setupFirebaseAuthMock();
      adminMocks.setupFirebaseAdminMock();
    },
  };
};
