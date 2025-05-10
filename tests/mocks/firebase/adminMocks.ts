import { jest } from '@jest/globals';
// import type { UserRecord, CreateRequest, UpdateRequest } from 'firebase-admin/auth'; // Temporarily using any
import { User as PrismaUser } from '@prisma/client';
import { mockUser as defaultPrismaUser } from '../data/mockData';

// Using any for Firebase Admin types temporarily due to persistent linting/type resolution issues
type UserRecord = any;
// type CreateRequest = any; // Not directly used in the simplified mocks
// type UpdateRequest = any; // Not directly used in the simplified mocks

const mapPrismaUserToFirebaseUserRecord = (prismaUser: PrismaUser): Partial<UserRecord> => ({
  uid: prismaUser.id,
  email: prismaUser.email ?? undefined,
  displayName: prismaUser.name ?? undefined,
  emailVerified: !!prismaUser.emailVerified,
  photoURL: prismaUser.image ?? undefined,
  metadata: {
    creationTime: prismaUser.createdAt.toISOString(),
    lastSignInTime: prismaUser.lastSignedInAt?.toISOString() ?? prismaUser.updatedAt.toISOString(),
  } as UserRecord['metadata'],
});

const mockAdminUserRecordPojo: Partial<UserRecord> =
  mapPrismaUserToFirebaseUserRecord(defaultPrismaUser);
export const mockSessionCookie = 'mock-session-cookie-for-testing';

// Typed Mocks
let verifyIdTokenMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let createSessionCookieMock = jest.fn<(...args: any[]) => Promise<string>>();
let verifySessionCookieMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let revokeRefreshTokensMock = jest.fn<(...args: any[]) => Promise<void>>();
let getUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let getUserByEmailMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let createUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let updateUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
let deleteUserMock = jest.fn<(...args: any[]) => Promise<void>>();
let createCustomTokenMock = jest.fn<(...args: any[]) => Promise<string>>();

const mockApps: any[] = [];

const mockAppInstance = {
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
};

export type MockAdminApp = typeof mockAppInstance;

let initializeAppMock: jest.Mock = jest.fn();
let getAppsMock: jest.Mock = jest.fn().mockReturnValue([]);
let getAppMock: jest.Mock = jest.fn();
export const adminAuthMock: jest.Mock = jest.fn(() => mockAppInstance);

function setDefaultImplementations() {
  verifyIdTokenMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  createSessionCookieMock.mockResolvedValue(mockSessionCookie);
  verifySessionCookieMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  revokeRefreshTokensMock.mockResolvedValue(undefined);
  getUserMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  getUserByEmailMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  createUserMock.mockImplementation(
    async (
      properties: any // Using any for properties
    ) =>
      ({
        ...mockAdminUserRecordPojo,
        ...properties,
        uid: properties.uid || mockAdminUserRecordPojo.uid || 'new-uid',
      }) as UserRecord
  );
  updateUserMock.mockImplementation(
    async (
      uid: string,
      properties: any // Using any for properties
    ) => ({ ...mockAdminUserRecordPojo, uid, ...properties }) as UserRecord
  );
  deleteUserMock.mockResolvedValue(undefined);
  createCustomTokenMock.mockImplementation(
    async (uid: string /*, _claims?: Record<string, any> */) => `mock-custom-token-for-${uid}`
  );
}

export const createFirebaseAdminMocks = () => {
  return {
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
    initializeAppMock,
    getAppsMock,
    getAppMock,
    adminAuthMock,
    setupFirebaseAdminMock: () => {
      jest.mock('firebase-admin', () => ({
        credential: {
          cert: jest.fn().mockReturnValue({ type: 'mockCredential' }),
        },
        initializeApp: initializeAppMock,
        get apps() {
          return getAppsMock();
        },
        app: getAppMock,
        auth: adminAuthMock,
      }));
    },
  };
};

export const resetFirebaseAdminMocks = () => {
  verifyIdTokenMock.mockClear();
  createSessionCookieMock.mockClear();
  verifySessionCookieMock.mockClear();
  revokeRefreshTokensMock.mockClear();
  getUserMock.mockClear();
  getUserByEmailMock.mockClear();
  createUserMock.mockClear();
  updateUserMock.mockClear();
  deleteUserMock.mockClear();
  createCustomTokenMock.mockClear();
  initializeAppMock.mockClear();
  getAppsMock.mockClear().mockReturnValue([]);
  getAppMock.mockClear();
  mockApps.length = 0; // Clear the module-scoped apps list

  initializeAppMock.mockImplementation(((options?: any, appName?: string) => {
    // Remove noisy debug logging
    // console.log(`[initializeAppMock CALLED] options: ${JSON.stringify(options)}, appName: ${appName}, current mockApps count: ${mockApps.length}`);

    const effectiveAppName = appName || options?.appName || '[DEFAULT]';

    // Check if an app with this name already exists
    let existingApp = mockApps.find(app => app.name === effectiveAppName);
    if (existingApp) {
      // console.log(`[initializeAppMock RETURNING EXISTING] App: ${existingApp.name}`);
      return existingApp;
    }

    // If no options and trying to get default, but no default exists yet, create one.
    if (!options && effectiveAppName === '[DEFAULT]' && mockApps.length === 0) {
      const defaultApp = { ...mockAppInstance, name: '[DEFAULT]', options: {} };
      mockApps.push(defaultApp);
      // console.log(`[initializeAppMock CREATED AND RETURNING DEFAULT (no options)] App: ${defaultApp.name}`);
      return defaultApp;
    }

    // If options are provided, create a new app or return existing if name matches (already handled above)
    if (options) {
      const newApp = { ...mockAppInstance, name: effectiveAppName, options: options || {} };
      mockApps.push(newApp);
      // console.log(`[initializeAppMock CREATED AND RETURNING NEW (with options)] App: ${newApp.name}`);
      return newApp;
    }

    // Fallback: if no options, no appName, and default doesn't exist (should be rare with above logic)
    // Or if called with no args and a default app exists from a previous init.
    if (mockApps.length > 0 && effectiveAppName === '[DEFAULT]') {
      // console.log(`[initializeAppMock RETURNING EXISTING DEFAULT (fallback)] App: ${mockApps[0].name}`);
      return mockApps[0];
    }

    // Absolute fallback if no logic matched (e.g. called with no options, no apps exist)
    const fallbackApp = { ...mockAppInstance, name: '[FALLBACK_APP]', options: {} };
    mockApps.push(fallbackApp); // Add to ensure getApps doesn't fail later
    // console.log(`[initializeAppMock RETURNING FALLBACK] App: ${fallbackApp.name}`);
    return fallbackApp;
  }) as any); // Cast to any to bypass signature issue

  getAppsMock.mockImplementation((() => {
    // console.log('[getAppsMock CALLED] returning count:', mockApps.length);
    return [...mockApps]; // Return a copy to prevent external modification
  }) as any); // Cast to any

  getAppMock.mockImplementation(((appName?: string) => {
    const appNameToFind = appName || '[DEFAULT]';
    const foundApp = mockApps.find(app => app.name === appNameToFind);

    // console.log(`[getAppMock CALLED] for '${appNameToFind}', found: ${foundApp?.name}`);
    if (foundApp) return foundApp;
    // To mimic firebase behavior: if no name provided and default doesn't exist, it might throw.
    // If name provided and not found, it throws.
    // For simplicity, if not found, we could return undefined or a new temp app, or throw.
    // Throwing is closer to real SDK if app is expected.
    // However, some tests might call getApp() without ensuring init, let's be lenient for mock.
    if (mockApps.length > 0 && !appName) return mockApps[0]; // lenient default
    return undefined; // or throw new Error(`Mock Firebase app named "${appNameToFind}" does not exist.`);
  }) as any); // Cast to any

  // Initialize a default app state within the mockApps array as part of the reset
  // This ensures that getApps() returns something and getApp() (default) can return an app
  // initializeAppMock({ appName: '[DEFAULT]' }); // This will call the new implementation and add [DEFAULT]
  // Ensure the default app is truly set up by the implementation
  const defaultAppInstance = initializeAppMock({}, '[DEFAULT]'); // Explicitly initialize [DEFAULT]
  if (!mockApps.find(app => app.name === '[DEFAULT]')) {
    if (defaultAppInstance) {
      mockApps.push(defaultAppInstance); // ensure it is there if the call somehow didn't add it.
    } else {
      //This case should not happen if initializeAppMock is correct
      const emergencyDefault = { ...mockAppInstance, name: '[DEFAULT]', options: {} };
      mockApps.push(emergencyDefault);
    }
  }
  // console.log('[resetFirebaseAdminMocks] After default init, mockApps:', JSON.stringify(mockApps.map(a => a.name)));

  adminAuthMock.mockClear().mockReturnValue(mockAppInstance);
  setDefaultImplementations();
};

export const {
  /* All the individual mocks */
} = createFirebaseAdminMocks();

// Call reset once when the module loads to set up initial default mocks.
resetFirebaseAdminMocks();
