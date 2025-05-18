import { jest } from '@jest/globals';
import * as admin from 'firebase-admin'; // Import for type referencing

// Use actual types for return values, not partials, to match admin.auth.Auth interface.
// For tests, we'll create minimal objects that satisfy these full types.
type MockUserRecord = admin.auth.UserRecord;
type MockDecodedIdToken = admin.auth.DecodedIdToken;

// Individual Firebase Auth method mocks
export const verifyIdTokenMock =
  jest.fn<(token: string, checkRevoked?: boolean) => Promise<MockDecodedIdToken>>();
export const createSessionCookieMock =
  jest.fn<(idToken: string, options: { expiresIn: number }) => Promise<string>>();
export const verifySessionCookieMock =
  jest.fn<(sessionCookie: string, checkRevoked?: boolean) => Promise<MockDecodedIdToken>>();
export const revokeRefreshTokensMock = jest.fn<(uid: string) => Promise<void>>();
export const getUserMock = jest.fn<(uid: string) => Promise<MockUserRecord>>();
export const getUserByEmailMock = jest.fn<(email: string) => Promise<MockUserRecord>>();
export const createUserMock =
  jest.fn<(properties: admin.auth.CreateRequest) => Promise<MockUserRecord>>();
export const updateUserMock =
  jest.fn<(uid: string, properties: admin.auth.UpdateRequest) => Promise<MockUserRecord>>();
export const deleteUserMock = jest.fn<(uid: string) => Promise<void>>();
export const createCustomTokenMock = jest.fn<(uid: string, claims?: object) => Promise<string>>();
export const listUsersMock =
  jest.fn<(maxResults?: number, pageToken?: string) => Promise<admin.auth.ListUsersResult>>();
export const setCustomUserClaimsMock =
  jest.fn<(uid: string, claims: object | null) => Promise<void>>();
export const generateEmailVerificationLinkMock =
  jest.fn<(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings) => Promise<string>>();
export const generatePasswordResetLinkMock =
  jest.fn<(email: string, actionCodeSettings?: admin.auth.ActionCodeSettings) => Promise<string>>();

// This object groups all the auth method mocks. It will be returned by the mocked getAuth().
export const authMethodsMockObject = {
  verifyIdToken: verifyIdTokenMock,
  createSessionCookie: createSessionCookieMock,
  verifySessionCookie: verifySessionCookieMock,
  revokeRefreshTokens: revokeRefreshTokensMock,
  getUser: getUserMock,
  getUserByEmail: getUserByEmailMock,
  createUser: createUserMock,
  updateUser: updateUserMock,
  deleteUser: deleteUserMock,
  createCustomToken: createCustomTokenMock,
  listUsers: listUsersMock,
  setCustomUserClaims: setCustomUserClaimsMock,
  generateEmailVerificationLink: generateEmailVerificationLinkMock,
  generatePasswordResetLink: generatePasswordResetLinkMock,
};

// Mock for admin.app.App instance
export const appInstanceMock = {
  name: 'mock-app',
  options: {},
  auth: () => authMethodsMockObject as unknown as admin.auth.Auth, // This is fine as it's a mock App
} as unknown as admin.app.App;

// Mocks for firebase-admin/app module functions
export const initializeAppMock =
  jest.fn<(options?: admin.AppOptions, name?: string) => admin.app.App>();
export const getAppsMock = jest.fn<() => admin.app.App[]>();
export const getAppMock = jest.fn<(name?: string) => admin.app.App>();

// Mock for firebase-admin/auth module functions
// This mock function will be used by the top-level admin.auth(app?) mock
export const getAuthMock = jest.fn<(app?: admin.app.App) => admin.auth.Auth>();

export const resetFirebaseAdminMocks = () => {
  verifyIdTokenMock.mockReset();
  createSessionCookieMock.mockReset();
  verifySessionCookieMock.mockReset();
  revokeRefreshTokensMock.mockReset();
  getUserMock.mockReset();
  getUserByEmailMock.mockReset();
  createUserMock.mockReset();
  updateUserMock.mockReset();
  deleteUserMock.mockReset();
  createCustomTokenMock.mockReset();
  listUsersMock.mockReset();
  setCustomUserClaimsMock.mockReset();
  generateEmailVerificationLinkMock.mockReset();
  generatePasswordResetLinkMock.mockReset();

  // Reset App mocks and their default implementations
  initializeAppMock.mockReset().mockReturnValue(appInstanceMock);
  getAppsMock.mockReset().mockReturnValue([appInstanceMock]);
  getAppMock.mockReset().mockReturnValue(appInstanceMock);

  // Reset Auth factory mock and its default implementation
  getAuthMock
    .mockReset()
    .mockImplementation(() => authMethodsMockObject as unknown as admin.auth.Auth);
};

// Factory to get all mocks. The test file will destructure what it needs.
export const createFirebaseAdminMocks = () => {
  // Ensure mocks are reset before providing them if desired (optional, test file can also call resetFirebaseAdminMocks)
  // resetFirebaseAdminMocks(); // Or let the test control this in beforeEach

  return {
    // Individual auth method mocks (for direct assertion)
    verifyIdTokenMock,
    createSessionCookieMock,
    verifySessionCookieMock,
    revokeRefreshTokensMock,
    getUserMock,
    getUserByEmailMock,
    createUserMock,
    updateUserMock,
    deleteUserMock,
    createCustomTokenMock,
    listUsersMock,
    setCustomUserClaimsMock,
    generateEmailVerificationLinkMock,
    generatePasswordResetLinkMock,

    // The main object containing all auth methods, to be returned by getAuth()
    authMethodsMockObject,

    // App module mocks
    initializeAppMock,
    getAppsMock,
    getAppMock,

    // Auth module mocks
    getAuthMock,

    // App instance mock (returned by initializeApp, getApp)
    appInstanceMock,

    // Utility to reset all these mocks
    resetFirebaseAdminMocks,
    // Removed setupFirebaseAdminMock as jest.mock calls are now responsibility of the test file
  };
};

// Initial setup of default mock implementations when this module is first imported
// This is important because the createFirebaseAdminMocks might be called after jest.mock has already run in the test file
// and we want the default implementations to be set.
getAuthMock.mockImplementation(() => authMethodsMockObject as unknown as admin.auth.Auth);
initializeAppMock.mockReturnValue(appInstanceMock);
getAppMock.mockReturnValue(appInstanceMock);
getAppsMock.mockReturnValue([appInstanceMock]);
