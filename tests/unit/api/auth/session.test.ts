// @ts-nocheck
// File: tests/unit/api/auth/session.test.ts
import { jest } from '@jest/globals';
import * as admin from 'firebase-admin';
// Import types from next/server. Due to jest.setup.api.js, these will be influenced by the mocks,
// but are used for type checking in tests.
import {
  type NextRequest as NextRequestType,
  type NextResponse as NextResponseType,
} from 'next/server';
import { HTTP_STATUS, AUTH } from '@/tests/utils/test-constants';
// prisma and logger will be mocked, so direct import for type is okay, but will be shadowed by mock
// import { prisma } from '@/lib/prisma';
// import { logger as mockedLogger } from '@/lib/client-logger';

// --- Variable Placeholders ---
// These will be assigned fresh mock instances or imported modules in beforeEach
let POST_handler: any;
let DELETE_handler: any;
let prismaUserFindUniqueMock: jest.Mock;
let prismaSessionCreateMock: jest.Mock;
let prismaSessionDeleteManyMock: jest.Mock;
let loggerMock: any;
// let FirebaseAdminServiceModule: any; // No longer needed with full module mock
let mockVerifyIdToken: jest.Mock;
let mockCreateSessionCookie: jest.Mock;
let mockGetServiceAccountApp: jest.Mock; // For the .getApp() method on the service instance
let mockGetFirebaseAdminApp: jest.Mock; // From the top-level doMock for @/lib/firebase/firebase-admin utility
// let ActualNextRequest: any; // No longer creating actual NextRequest instances for POST due to .json() issues
// let ActualNextResponse: any; // No longer needed; SUT will use NextResponse from jest.setup.api.js global mock

// --- Constants for Mocks ---
const MOCK_USER_ID = 'test-user-id-xxyyzz';
const MOCK_USER_EMAIL = 'test@example.com';
const MOCK_SESSION_COOKIE = AUTH.MOCK_SESSION_COOKIE;
const mockDecodedToken = {
  uid: MOCK_USER_ID,
  email: MOCK_USER_EMAIL,
  email_verified: true,
};
const MOCK_PRISMA_SESSION_ID = 'mock-prisma-session-id-abcdef';
const MOCK_PRISMA_USER = { id: MOCK_USER_ID, email: MOCK_USER_EMAIL };
const MOCK_PRISMA_SESSION = {
  id: MOCK_PRISMA_SESSION_ID,
  sessionToken: MOCK_SESSION_COOKIE,
  userId: MOCK_USER_ID,
  expires: new Date(Date.now() + 3600000),
};

// --- Mocks Setup (Top-level jest.doMock for prisma, logger, firebase-admin, and firebase-admin-service) ---

// 1. Mock Prisma Client
jest.doMock('@/lib/prisma', () => {
  // Define the mock structure inside the factory to ensure it's fresh
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(), // Bare jest.fn(), will be configured in beforeEach
      deleteMany: jest.fn(),
    },
    // Add any other prisma models/methods if needed by the SUT
  };
  return { prisma: mockPrismaClient };
});

// 2. Mock Logger
const actualLoggerMocks = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(), // Important for chained calls like logger.child(...).info(...)
};
// actualLoggerMocks.child.mockReturnThis(); // This line is redundant due to inline mockReturnThis above

jest.doMock('@/lib/logger', () => ({
  __esModule: true, // Good practice for ES modules
  createLogger: jest.fn(() => actualLoggerMocks), // createLogger now returns the mock logger
  logger: actualLoggerMocks, // Export the logger instance directly as well
  // Mock getRequestId if it's also used by the SUT or its dependencies from this module
  getRequestId: jest.fn(() => 'mock-request-id'),
}));

// 3. Mock Firebase Admin SDK utility (used by FirebaseAdminService internally or elsewhere)
mockGetFirebaseAdminApp = jest.fn().mockReturnValue({ name: 'mocked-app-via-doMock-utility' });
jest.doMock('@/lib/firebase/firebase-admin', () => ({
  getFirebaseAdminApp: mockGetFirebaseAdminApp,
}));

// 4. Mock FirebaseAdminService (the entire service module)
const mockFirebaseAdminServiceInstance = {
  // This is the object that getInstance() will return
  verifyIdToken: jest.fn(),
  createSessionCookie: jest.fn(),
  getApp: jest.fn(), // This is the .getApp() method on the service instance
};

const mockFirebaseAdminServiceStatic = {
  // This mocks the static parts of the class, e.g., FirebaseAdminService.getInstance
  getInstance: jest.fn().mockReturnValue(mockFirebaseAdminServiceInstance),
};

jest.doMock('@/lib/services/firebase-admin-service', () => ({
  FirebaseAdminService: mockFirebaseAdminServiceStatic, // Mock the class itself (specifically its static methods like getInstance)
}));

// --- Test Suite ---
describe('API Route: /api/auth/session', () => {
  beforeEach(async () => {
    jest.resetModules(); // Clears the cache for all modules. jest.setup.api.js mocks should re-apply.

    // --- Re-configure mocks for this specific test run (AFTER resetModules) ---

    // Prisma Mocks (re-assigning to the top-level variables)
    const mockPrismaModule = jest.requireMock('@/lib/prisma');
    prismaUserFindUniqueMock = mockPrismaModule.prisma.user.findUnique;
    prismaSessionCreateMock = mockPrismaModule.prisma.session.create;
    prismaSessionDeleteManyMock = mockPrismaModule.prisma.session.deleteMany;
    prismaUserFindUniqueMock.mockResolvedValue(MOCK_PRISMA_USER);
    prismaSessionCreateMock.mockResolvedValue(MOCK_PRISMA_SESSION);
    prismaSessionDeleteManyMock.mockResolvedValue({ count: 1 });

    // Logger Mock (re-assigning to the top-level variable)
    const mockLoggerModule = jest.requireMock('@/lib/logger');
    loggerMock = mockLoggerModule.logger; // This will now be undefined as the mock exports createLogger
    // We need to get the instance returned by createLogger if we want to inspect it directly
    // However, for most tests, it's enough that createLogger is callable and returns a valid logger mock.
    Object.values(actualLoggerMocks).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear());
    actualLoggerMocks.child.mockReturnThis(); // Ensure child returns the logger instance for chaining

    // Firebase Admin Service and its method mocks
    const FirebaseAdminServiceMockedStaticCtrl = jest.requireMock(
      '@/lib/services/firebase-admin-service'
    ).FirebaseAdminService;
    FirebaseAdminServiceMockedStaticCtrl.getInstance.mockClear();
    mockVerifyIdToken = mockFirebaseAdminServiceInstance.verifyIdToken;
    mockCreateSessionCookie = mockFirebaseAdminServiceInstance.createSessionCookie;
    mockGetServiceAccountApp = mockFirebaseAdminServiceInstance.getApp;
    mockVerifyIdToken.mockReset().mockResolvedValue(mockDecodedToken as admin.auth.DecodedIdToken);
    mockCreateSessionCookie.mockReset().mockResolvedValue(MOCK_SESSION_COOKIE);
    mockGetFirebaseAdminApp.mockClear().mockReturnValue({ name: 'mocked-app-in-beforeEach' });
    mockGetServiceAccountApp.mockReset().mockReturnValue(mockGetFirebaseAdminApp());

    // We are now relying on the global mock of 'next/server' from jest.setup.api.js.
    // No need for jest.doMock('next/server', ...) here.
    // No need to acquire ActualNextResponse here for the SUT.

    // Dynamically import SUT. It will use the globally mocked 'next/server'.
    const routeFile = await import('@/app/api/auth/session/route');
    POST_handler = routeFile.POST;
    DELETE_handler = routeFile.DELETE;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Use clearAllMocks as per jest.setup.api.js, instead of restoreAllMocks
  });

  // --- POST Tests ---
  describe('POST /api/auth/session', () => {
    it('should create a session and return 200 on valid Firebase ID token', async () => {
      const requestBody = { token: 'mock-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: {
          get: jest.fn(),
          set: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
        },
      } as unknown as NextRequestType;

      const response = (await POST_handler(req)) as NextResponseType & {
        cookies: { set: jest.Mock; get: jest.Mock };
      }; // Cast to include mocked cookies for assertion

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ status: 'success', message: 'Session created' });

      // The cookies.set is on the response object returned by the mocked NextResponse.json
      // from jest.setup.api.js. We need to ensure it was called.
      // The mock in jest.setup.api.js for NextResponse.json().cookies.set is jest.fn()
      // How to access it for assertion? The `response` object itself has the `cookies` property.
      expect(response.cookies.set).toHaveBeenCalledWith({
        name: AUTH.COOKIE_NAME,
        value: MOCK_SESSION_COOKIE,
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS,
      });

      // Assertions for service calls (unchanged)
      expect(mockVerifyIdToken).toHaveBeenCalledWith(requestBody.token, true);
      expect(prismaUserFindUniqueMock).toHaveBeenCalledWith({ where: { id: MOCK_USER_ID } });
      expect(prismaSessionCreateMock).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          expires: expect.any(Date),
          sessionToken: 'placeholder-for-session-token',
        },
      });
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(requestBody.token, {
        expiresIn: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS * 1000,
      });
    });

    // ... other POST tests for failure cases (token missing, verifyIdToken fails, user not found, etc.)
    it('should return 400 if token is missing', async () => {
      const requestBody = {}; // No token
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody), // Will effectively be an empty object
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;
      const response = await POST_handler(req);
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = await response.json(); // This might still fail if NextResponse.json is broken
      expect(responseBody.error).toBe('Token is required');
    });

    it('should return 401 if Firebase token verification fails', async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid Firebase ID token'));
      const requestBody = { token: 'invalid-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;
      const response = await POST_handler(req);
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Invalid Firebase ID token');
    });

    it('should return 404 if user is not found in Prisma DB', async () => {
      prismaUserFindUniqueMock.mockResolvedValueOnce(null); // User not found
      const requestBody = { token: 'mock-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;
      const response = await POST_handler(req);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('User not found in database for session creation.');
    });

    it('should return 500 if prisma.session.create fails', async () => {
      prismaSessionCreateMock.mockRejectedValueOnce(new Error('DB session create error'));
      const requestBody = { token: 'mock-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;
      const response = await POST_handler(req);
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('DB session create error');
      expect(responseBody.originalErrorMessage).toBe('DB session create error');
    });

    it('should return 500 if createSessionCookie fails', async () => {
      mockCreateSessionCookie.mockRejectedValueOnce(new Error('Session cookie creation failed'));
      const requestBody = { token: 'mock-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;
      const response = await POST_handler(req);
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Session cookie creation failed');
      expect(responseBody.originalErrorMessage).toBe('Session cookie creation failed');
    });
  });

  // --- DELETE Tests ---
  describe('DELETE /api/auth/session', () => {
    it('should delete the session cookie, returning 200', async () => {
      const req = {
        headers: new Headers(),
        method: 'DELETE',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn(), clear: jest.fn() },
      } as unknown as NextRequestType;

      const response = (await DELETE_handler(req)) as NextResponseType & {
        cookies: { set: jest.Mock };
      };

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ status: 'success', message: 'Session deleted' });

      expect(response.cookies.set).toHaveBeenCalledWith({
        name: AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 0,
      });
    });
  });
});
