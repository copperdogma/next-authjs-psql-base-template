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

// Individual method mocks - ADD export
export let verifyIdTokenMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let createSessionCookieMock = jest.fn<(...args: any[]) => Promise<string>>();
export let verifySessionCookieMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let revokeRefreshTokensMock = jest.fn<(...args: any[]) => Promise<void>>();
export let getUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let getUserByEmailMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let createUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let updateUserMock = jest.fn<(...args: any[]) => Promise<UserRecord>>();
export let deleteUserMock = jest.fn<(...args: any[]) => Promise<void>>();
export let createCustomTokenMock = jest.fn<(...args: any[]) => Promise<string>>();
export let listUsersMock = jest.fn<(...args: any[]) => Promise<any>>();
export let setCustomUserClaimsMock = jest.fn<(...args: any[]) => Promise<void>>();
export let generateEmailVerificationLinkMock = jest.fn<(...args: any[]) => Promise<string>>();
export let generatePasswordResetLinkMock = jest.fn<(...args: any[]) => Promise<string>>();

const mockApps: any[] = [];

// This object will be returned by initializeAppMock and getAppMock
// It no longer needs to contain the auth service methods directly
const mockAppDefinition = {
  // name and options will be added by initializeAppMock logic
  // auth: () => {}, // This will be handled by the global admin.auth() mock
};

let initializeAppMock: jest.Mock = jest.fn();
let getAppsMock: jest.Mock = jest.fn().mockReturnValue([]);
let getAppMock: jest.Mock = jest.fn();

function setDefaultImplementations() {
  verifyIdTokenMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  createSessionCookieMock.mockResolvedValue(mockSessionCookie);
  verifySessionCookieMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  revokeRefreshTokensMock.mockResolvedValue(undefined);
  getUserMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  getUserByEmailMock.mockResolvedValue(mockAdminUserRecordPojo as UserRecord);
  createUserMock.mockImplementation(
    async (properties: any) =>
      ({
        ...mockAdminUserRecordPojo,
        ...properties,
        uid: properties.uid || mockAdminUserRecordPojo.uid || 'new-uid',
      }) as UserRecord
  );
  updateUserMock.mockImplementation(
    async (uid: string, properties: any) =>
      ({ ...mockAdminUserRecordPojo, uid, ...properties }) as UserRecord
  );
  deleteUserMock.mockResolvedValue(undefined);
  createCustomTokenMock.mockImplementation(async (uid: string) => `mock-custom-token-for-${uid}`);
  listUsersMock.mockResolvedValue({ users: [], pageToken: undefined });
  setCustomUserClaimsMock.mockResolvedValue(undefined);
  generateEmailVerificationLinkMock.mockResolvedValue('mock-email-verification-link');
  generatePasswordResetLinkMock.mockResolvedValue('mock-password-reset-link');
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
    listUsersMock,
    setCustomUserClaimsMock,
    generateEmailVerificationLinkMock,
    generatePasswordResetLinkMock,
    initializeAppMock,
    getAppsMock,
    getAppMock,
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
        auth: jest.fn(() => ({
          // Directly return the object for admin.auth()
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
          // Ensure other methods potentially called by SUT are also here as jest.fn()
          // Example: storage: jest.fn(), firestore: jest.fn() if they were part of Auth service (they are not, they are on App)
        })),
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
  listUsersMock.mockClear();
  setCustomUserClaimsMock.mockClear();
  generateEmailVerificationLinkMock.mockClear();
  generatePasswordResetLinkMock.mockClear();

  initializeAppMock.mockClear();
  getAppsMock.mockClear().mockReturnValue([]);
  getAppMock.mockClear();
  mockApps.length = 0;

  initializeAppMock.mockImplementation(((options?: any, appName?: string) => {
    const effectiveAppName = appName || options?.appName || '[DEFAULT]';
    let existingApp = mockApps.find(app => app.name === effectiveAppName);
    if (existingApp) return existingApp;

    const newAppInstance = { ...mockAppDefinition, name: effectiveAppName, options: options || {} };
    if (!options && effectiveAppName === '[DEFAULT]' && mockApps.length === 0) {
      mockApps.push(newAppInstance);
      return newAppInstance;
    }
    if (options) {
      mockApps.push(newAppInstance);
      return newAppInstance;
    }
    if (mockApps.length > 0 && effectiveAppName === '[DEFAULT]') return mockApps[0];
    mockApps.push(newAppInstance); // Fallback app
    return newAppInstance;
  }) as any);

  getAppsMock.mockImplementation((() => [...mockApps]) as any);

  getAppMock.mockImplementation(((appName?: string) => {
    const appNameToFind = appName || '[DEFAULT]';
    const foundApp = mockApps.find(app => app.name === appNameToFind);
    if (foundApp) return foundApp;
    if (mockApps.length > 0 && !appName) return mockApps[0];
    return undefined;
  }) as any);

  const defaultAppInstance = initializeAppMock({}, '[DEFAULT]');
  if (!mockApps.find(app => app.name === '[DEFAULT]')) {
    if (defaultAppInstance) {
      mockApps.push(defaultAppInstance);
    } else {
      const emergencyDefault = { ...mockAppDefinition, name: '[DEFAULT]', options: {} };
      mockApps.push(emergencyDefault);
    }
  }

  setDefaultImplementations();
};

resetFirebaseAdminMocks();
