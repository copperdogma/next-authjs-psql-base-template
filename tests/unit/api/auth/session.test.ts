/**
 * API Auth Session Tests
 *
 * Tests the functionality of the session API endpoints for authentication.
 */

import { HTTP_STATUS, AUTH } from '../../../utils/test-constants';
import { mockUser } from '../../../mocks/data/mockData';
import {
  createFirebaseAdminMocks,
  resetFirebaseAdminMocks as resetAdminMocks, // Renamed for clarity if needed, or use directly
  authMethodsMockObject, // Import the mock auth object
  initializeAppMock as adminInitializeAppMock,
  getAppMock as adminGetAppMock,
  getAppsMock as adminGetAppsMock,
  appInstanceMock as adminAppInstanceMock,
} from '../../../mocks/firebase/adminMocks';
import { jest } from '@jest/globals';
import * as admin from 'firebase-admin'; // For types, if needed beyond mocks
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest and NextResponse

// **MOVED TO TOP** Mock next/server for NextResponse.json
const mockCookiesSet = jest.fn();
const mockCookiesGet = jest.fn();
const mockNextResponseJsonFn = jest.fn<
  (
    body?: any,
    init?: { status?: number }
  ) => {
    status: number;
    cookies: {
      set: typeof mockCookiesSet;
      get: typeof mockCookiesGet;
    };
    json: () => Promise<any>;
    text: () => Promise<string>;
  }
>();

// Assign the default implementation directly to the mock function
mockNextResponseJsonFn.mockImplementation((body?: any, init?: { status?: number }) => {
  return {
    status: init?.status ?? HTTP_STATUS.OK,
    cookies: {
      set: mockCookiesSet,
      get: mockCookiesGet,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
});

// Define an explicit type for the mock Firebase Admin app instance if needed
type MockAdminApp = Partial<admin.app.App> & {
  auth: () => Partial<admin.auth.Auth>;
};

// === Top-level Mocks (Order Matters) ===

// 1. Mock 'firebase-admin'
// This is the primary mock. It ensures that any import of 'firebase-admin'
// within the SUT (session/route.ts) or its dependencies gets this mocked version.
jest.mock('firebase-admin', () => {
  // console.log('firebase-admin mock being called'); // Debug log
  return {
    __esModule: true, // Required for ES modules
    initializeApp: adminInitializeAppMock,
    // app: jest.fn((name?: string) => (name ? adminGetAppMock(name) : adminAppInstanceMock)),
    app: jest.fn((name?: string) => {
      // console.log(`firebase-admin.app mock called with name: ${name}`); // Debug log
      const appInstance = name ? adminGetAppMock(name) : adminAppInstanceMock;
      // Ensure the app instance itself has the auth method if it's called like app().auth()
      // This mirrors how FirebaseAdminService might get its auth instance.
      // @ts-ignore
      appInstance.auth = () => authMethodsMockObject;
      return appInstance;
    }),
    apps: adminGetAppsMock(),
    // auth: () => authMethodsMockObject, // Direct auth() call from admin import
    auth: jest.fn(() => {
      // console.log('firebase-admin.auth() mock called, returning authMethodsMockObject'); // Debug log
      return authMethodsMockObject;
    }),
    credential: { cert: jest.fn() }, // Mock credential.cert if needed
  };
});

// NEW MOCK for lib/firebase/firebase-admin.ts
// This mock intercepts calls to getFirebaseAdminApp and returns a mock app instance,
// preventing the actual SDK initialization during tests.
// It should use the same adminAppInstanceMock that the 'firebase-admin' mock provides.
jest.mock('@/lib/firebase/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => {
    // console.log('Mock getFirebaseAdminApp called'); // Debug log
    // Ensure the mock app instance provided here has the necessary auth method
    // consistent with what FirebaseAdminService expects.
    // @ts-ignore
    adminAppInstanceMock.auth = () => authMethodsMockObject;
    return adminAppInstanceMock;
  }),
}));

// 2. Mock FirebaseAdminService - if route.ts *directly* instantiates and uses it.
// The route handler uses functions from '@/lib/auth/session'.
// Let's check if session.ts (imported by route.ts) uses FirebaseAdminService.
// If session.ts or its dependencies initialize FirebaseAdminService, this mock is needed.
// Based on previous logs, FirebaseAdminService is indeed used.
jest.mock('@/lib/services/firebase-admin-service', () => ({
  FirebaseAdminService: jest.fn().mockImplementation(() => {
    // console.log('Mock FirebaseAdminService constructor called'); // Debug log
    return {
      verifyIdToken: authMethodsMockObject.verifyIdToken,
      createSessionCookie: authMethodsMockObject.createSessionCookie,
      // Add other methods of FirebaseAdminService if they are called by the SUT
    };
  }),
}));

// 3. Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    child: jest.fn(() => ({
      // Ensure child returns an object with logging methods
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    })),
  },
}));

// === Local Mocks ===
const LOCAL_MOCK_SESSION_COOKIE = 'mock-session-cookie-for-this-test-session-api';

// Destructure the actual mock functions we'll be using from authMethodsMockObject
// These are the functions we will spy on and provide mock implementations for.
const {
  verifyIdToken: mockVerifyIdTokenFn, // Renamed for clarity in tests
  createSessionCookie: mockCreateSessionCookieFn, // Renamed for clarity
  // Add other auth methods if needed by these tests
} = authMethodsMockObject;

describe('API /api/auth/session', () => {
  // Import SUT here, after all jest.mock calls have been hoisted and processed.
  let POST: any;
  let DELETE: any;

  beforeAll(async () => {
    jest.resetModules(); // Reset modules before dynamic mock and import

    // Use jest.doMock for next/server specifically for this describe block
    jest.doMock('next/server', () => {
      const originalModule = jest.requireActual('next/server') as typeof import('next/server');
      // Create a mock constructor for NextResponse
      const MockNextResponse = jest.fn();
      // Assign our mockNextResponseJsonFn (defined in the outer scope) to the static 'json' property
      (MockNextResponse as any).json = mockNextResponseJsonFn;

      return {
        __esModule: true,
        NextResponse: MockNextResponse, // Use the mock constructor
        NextRequest: originalModule.NextRequest, // Keep using the actual NextRequest
      };
    });

    // Dynamically import the route handlers to ensure mocks are applied first.
    const route = await import('../../../../app/api/auth/session/route');
    POST = route.POST;
    DELETE = route.DELETE;
  });

  // mockRequest will be an object that needs to be correctly typed for NextRequest
  interface MockRequestData {
    token?: string;
    // other potential body fields
  }
  interface MockRequest extends Omit<NextRequest, 'json' | 'cookies'> {
    json: jest.MockedFunction<() => Promise<MockRequestData>>; // Use jest.MockedFunction
    cookies?: Partial<NextRequest['cookies'] & { set: jest.Mock; get: jest.Mock }>;
  }
  let mockRequest: MockRequestData; // This will hold the body, not the request object

  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminMocks();

    // Clear the new spy
    mockNextResponseJsonFn.mockClear();

    mockCookiesSet.mockClear();
    mockCookiesGet.mockClear();

    // Default successful mock implementations for Firebase auth methods
    // These are now set on the functions from authMethodsMockObject
    mockVerifyIdTokenFn.mockResolvedValue({
      uid: mockUser.id,
      email: mockUser.email,
    } as admin.auth.DecodedIdToken);

    mockCreateSessionCookieFn.mockResolvedValue(LOCAL_MOCK_SESSION_COOKIE);
  });

  // Helper to create a mock NextRequest object
  const createMockNextRequest = (
    body: MockRequestData | null,
    headers?: HeadersInit,
    method?: string,
    cookiesMock?: any
  ): NextRequest => {
    const req = new NextRequest(new URL('http://localhost/api/auth/session'), {
      method: method || 'POST',
      headers: headers || new Headers({ 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : null,
    });
    // Override the json method with our mock
    // @ts-ignore A bit hacky, but needed to attach a Jest mock to an instance method
    req.json = jest.fn().mockResolvedValue(body) as jest.MockedFunction<
      () => Promise<MockRequestData>
    >;
    if (cookiesMock) {
      // @ts-ignore
      req.cookies = cookiesMock;
    }
    return req;
  };

  describe('POST', () => {
    test('should create a session and set cookie on successful token verification', async () => {
      const idToken = 'valid-firebase-id-token';
      const requestBody = { token: idToken };
      const req = createMockNextRequest(requestBody);

      await POST(req);

      // @ts-ignore
      expect(req.json).toHaveBeenCalledTimes(1);
      expect(mockVerifyIdTokenFn).toHaveBeenCalledWith(idToken);
      expect(mockCreateSessionCookieFn).toHaveBeenCalledWith(idToken, {
        expiresIn: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS * 1000,
      });
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { status: 'success' },
        { status: HTTP_STATUS.OK }
      );
      expect(mockCookiesSet).toHaveBeenCalledWith({
        name: AUTH.COOKIE_NAME,
        value: LOCAL_MOCK_SESSION_COOKIE,
        httpOnly: true,
        maxAge: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: false, // Adjust if your test environment or defaults are different
      });
    });

    test('should return 400 if no token is provided', async () => {
      const requestBody = {}; // No token
      const req = createMockNextRequest(requestBody);
      await POST(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { error: 'No token provided' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
      expect(mockVerifyIdTokenFn).not.toHaveBeenCalled();
    });

    test('should return 401 if token verification fails', async () => {
      const idToken = 'invalid-firebase-id-token';
      const requestBody = { token: idToken };
      const req = createMockNextRequest(requestBody);
      const verificationError = new Error('Invalid token');
      // @ts-ignore
      verificationError.code = 'auth/id-token-expired';
      mockVerifyIdTokenFn.mockRejectedValueOnce(verificationError);
      await POST(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { error: 'Invalid token or Firebase error' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
      expect(mockCreateSessionCookieFn).not.toHaveBeenCalled();
    });

    test('should return 500 if creating session cookie fails', async () => {
      const idToken = 'valid-token-but-cookie-fails';
      const requestBody = { token: idToken };
      const req = createMockNextRequest(requestBody);
      mockCreateSessionCookieFn.mockRejectedValueOnce(new Error('Session cookie creation failed'));
      await POST(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { error: 'Could not create session cookie' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    });

    test('should return 400 if request body is malformed (e.g., not JSON)', async () => {
      // To simulate malformed JSON, the actual req.json() would throw an error.
      // We can mock our req.json() to throw such an error.
      const req = createMockNextRequest(null); // body is null, but we mock json()
      // @ts-ignore
      req.json = jest
        .fn()
        .mockRejectedValueOnce(new SyntaxError('Unexpected token i in JSON at position 0'));
      await POST(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { error: 'Invalid request body' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    });
  });

  describe('DELETE', () => {
    test('should clear the session cookie and return success', async () => {
      const cookiesMock = {
        get: mockCookiesGet.mockReturnValue({
          name: AUTH.COOKIE_NAME,
          value: LOCAL_MOCK_SESSION_COOKIE,
        }),
        set: mockCookiesSet,
      };
      const req = createMockNextRequest(null, undefined, 'DELETE', cookiesMock);
      await DELETE(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { status: 'success' },
        { status: HTTP_STATUS.OK }
      );
      expect(mockCookiesSet).toHaveBeenCalledWith({
        name: AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: false, // Adjust based on actual secure flag usage
      });
    });

    it('should still clear cookie and return success even if no cookie was initially present', async () => {
      const cookiesMock = {
        get: mockCookiesGet.mockReturnValue(undefined), // Simulate no cookie found
        set: mockCookiesSet,
      };
      const req = createMockNextRequest(null, undefined, 'DELETE', cookiesMock);
      await DELETE(req);
      expect(mockNextResponseJsonFn).toHaveBeenCalledWith(
        { status: 'success' },
        { status: HTTP_STATUS.OK }
      );
      expect(mockCookiesSet).toHaveBeenCalledWith({
        name: AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: false, // Adjust based on actual secure flag usage
      });
    });
  });
});
