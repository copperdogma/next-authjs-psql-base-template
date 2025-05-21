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
// These will be assigned fresh mock instances or imported modules in beforeEach OR via jest.isolateModulesAsync
let POST_handler_isolated: any;
let DELETE_handler_isolated: any;
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
// This mock can remain if other parts of the system (or a more detailed FirebaseAdminService mock) use it.
// However, for the session route, it's less direct now.
mockGetFirebaseAdminApp = jest
  .fn()
  .mockReturnValue({ name: 'mocked-app-via-doMock-utility-lib-firebase-firebase-admin' });
jest.doMock('@/lib/firebase/firebase-admin', () => ({
  getFirebaseAdminApp: mockGetFirebaseAdminApp,
}));

// 4. MOCK THE NEW ENTRY POINT: lib/server/services.ts for getFirebaseAdminService
const mockFirebaseAdminServiceInstanceFromGetter = {
  verifyIdToken: jest.fn(),
  createSessionCookie: jest.fn(),
  isInitialized: jest.fn().mockReturnValue(true), // Assume initialized by default for tests
  // Add getAuth or other methods if the session route uses them directly on the service instance
  getAuth: jest.fn(), // Example: if sessionRoute calls adminService.getAuth()
};
const mockGetFirebaseAdminService = jest
  .fn()
  .mockResolvedValue(mockFirebaseAdminServiceInstanceFromGetter);

jest.doMock('@/lib/server/services', () => ({
  __esModule: true,
  getFirebaseAdminService: mockGetFirebaseAdminService,
  // Mock other exports from lib/server/services if session.test.ts or its dependencies use them
}));

// --- Test Suite ---
describe('API Route: /api/auth/session', () => {
  beforeEach(async () => {
    // Set NODE_ENV to test explicitly here before any module loading for the test
    process.env.NODE_ENV = 'test';
    jest.resetModules(); // Still useful for other mocks not handled by isolateModulesAsync

    // Re-configure standard mocks for prisma, logger, firebase-admin-service etc.
    // This is the same as your existing beforeEach mock setup for these services.
    // (Ensure prismaUserFindUniqueMock, prismaSessionCreateMock, loggerMock etc. are set up here)
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
    Object.values(actualLoggerMocks).forEach(
      mockFn => typeof mockFn === 'function' && mockFn.mockClear()
    );
    actualLoggerMocks.child.mockReturnThis(); // Ensure child returns the logger instance for chaining

    // Firebase Admin Service and its method mocks
    // We now primarily configure the mock returned by getFirebaseAdminService
    mockGetFirebaseAdminService
      .mockClear()
      .mockResolvedValue(mockFirebaseAdminServiceInstanceFromGetter);

    // Assign the method mocks from the instance that getFirebaseAdminService will return
    mockVerifyIdToken = mockFirebaseAdminServiceInstanceFromGetter.verifyIdToken;
    mockCreateSessionCookie = mockFirebaseAdminServiceInstanceFromGetter.createSessionCookie;
    // Ensure these are reset and configured for each test
    mockVerifyIdToken.mockReset().mockResolvedValue(mockDecodedToken as admin.auth.DecodedIdToken);
    mockCreateSessionCookie.mockReset().mockResolvedValue(MOCK_SESSION_COOKIE);
    (mockFirebaseAdminServiceInstanceFromGetter.isInitialized as jest.Mock)
      .mockReset()
      .mockReturnValue(true);
    // Configure getAuth if used by the SUT
    (mockFirebaseAdminServiceInstanceFromGetter.getAuth as jest.Mock).mockReset().mockReturnValue({
      /* your mock auth object */
    });

    // The old way of mocking FirebaseAdminService.getInstance is no longer needed here:
    // const FirebaseAdminServiceMockedStaticCtrl = jest.requireMock(
    //   '@/lib/services/firebase-admin-service'
    // ).FirebaseAdminService;
    // FirebaseAdminServiceMockedStaticCtrl.getInstance.mockClear();
    // mockGetServiceAccountApp = mockFirebaseAdminServiceInstance.getApp; // This was for the old service instance mock
    // mockGetFirebaseAdminApp.mockClear().mockReturnValue({ name: 'mocked-app-in-beforeEach' }); // This is for the @/lib/firebase/firebase-admin utility, might still be relevant if other parts use it
    // mockGetServiceAccountApp.mockReset().mockReturnValue(mockGetFirebaseAdminApp());

    // We are now relying on the global mock of 'next/server' from jest.setup.api.js.
    // No need for jest.doMock('next/server', ...) here.
    // No need to acquire ActualNextResponse here for the SUT.

    // Dynamically import SUT using jest.isolateModulesAsync to ensure fresh state and NODE_ENV is respected
    await jest.isolateModulesAsync(async () => {
      const routeModule = await import('@/app/api/auth/session/route');
      POST_handler_isolated = routeModule.POST;
      DELETE_handler_isolated = routeModule.DELETE;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Optional: Restore NODE_ENV if it was changed, though jest.setup.env.js should handle the baseline
    // process.env.NODE_ENV = originalNodeEnv; // If you had an originalNodeEnv variable
  });

  // --- POST Tests (use POST_handler_isolated) ---
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

      const response = (await POST_handler_isolated(req)) as NextResponseType & {
        cookies: { set: jest.Mock; get: jest.Mock };
      }; // Cast to include mocked cookies for assertion

      expect(mockGetFirebaseAdminService).toHaveBeenCalledTimes(1); // Verify the new getter was called
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
        secure: false,
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
      const response = await POST_handler_isolated(req);
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = await response.json(); // This might still fail if NextResponse.json is broken
      expect(responseBody.error).toBe('Token is required');
    });

    it('should return 503 if getFirebaseAdminService returns null (service unavailable)', async () => {
      mockGetFirebaseAdminService.mockResolvedValue(null);

      const requestBody = { token: 'mock-firebase-id-token' };
      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(requestBody),
        method: 'POST',
        url: 'http://localhost/api/auth/session',
        cookies: { get: jest.fn() },
      } as unknown as NextRequestType;

      const response = await POST_handler_isolated(req);
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR); // Or 503 if your route maps it
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Authentication service is currently unavailable.');
      // Check logger if the route logs this specific scenario
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Session POST: FirebaseAdminService not available.'
      );
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
      const response = await POST_handler_isolated(req);
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
      const response = await POST_handler_isolated(req);
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
      const response = await POST_handler_isolated(req);
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
      const response = await POST_handler_isolated(req);
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Session cookie creation failed');
      expect(responseBody.originalErrorMessage).toBe('Session cookie creation failed');
    });
  });

  // --- DELETE Tests (use DELETE_handler_isolated) ---
  describe('DELETE /api/auth/session', () => {
    it('should delete the session cookie, returning 200', async () => {
      const req = {
        headers: new Headers(),
        method: 'DELETE',
        url: 'http://localhost/api/auth/session',
        cookies: {
          get: jest.fn().mockReturnValue({ name: AUTH.COOKIE_NAME, value: MOCK_SESSION_COOKIE }),
          set: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn().mockReturnValue(true),
        },
      } as unknown as NextRequestType;

      const response = (await DELETE_handler_isolated(req)) as NextResponseType & {
        cookies: { set: jest.Mock; get: jest.Mock };
      };

      expect(response.status).toBe(HTTP_STATUS.OK);
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
