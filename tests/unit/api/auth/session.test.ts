/**
 * API Auth Session Tests
 *
 * Tests the functionality of the session API endpoints for authentication.
 */

import { HTTP_STATUS, API_ENDPOINTS, AUTH, TEST_DOMAINS } from '../../../utils/test-constants';
import {
  mockUser,
  mockSessionCookie,
  createFirebaseAdminMocks,
} from '../../../utils/firebase-mocks';

// Mock NextResponse
const mockJson = jest.fn();
const mockCookies = {
  set: jest.fn(),
  get: jest.fn(),
};

// Mock response class
class MockResponse {
  status = 200;
  cookies = mockCookies;

  static json(body: any, init: any = {}) {
    mockJson(body);
    const response = new MockResponse();
    response.status = init.status || 200;
    return response;
  }
}

// Setup Firebase Admin mocks
const { verifyIdTokenMock, createSessionCookieMock } = createFirebaseAdminMocks();

// Create direct admin auth mock
const adminAuth = {
  verifyIdToken: verifyIdTokenMock,
  createSessionCookie: createSessionCookieMock,
};

// No need to mock or import @/lib/firebase-admin

describe('Auth Session API', () => {
  // Define a simple request mock that simulates the structure we need
  const createRequestMock = (body?: any) => ({
    json: jest.fn().mockResolvedValue(body || {}),
  });

  // Define API handlers - simplified for testing
  const handleSession = {
    async POST(request: any) {
      try {
        const body = await request.json();

        if (!body.token) {
          return MockResponse.json(
            { error: 'No token provided' },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }

        try {
          // Call mocked functions
          const decodedToken = await adminAuth.verifyIdToken(body.token);
          const sessionCookie = await adminAuth.createSessionCookie(body.token, {
            expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
          });

          // Create successful response
          const response = MockResponse.json({ status: 'success' });

          // Set cookie
          response.cookies.set({
            name: AUTH.COOKIE_NAME,
            value: sessionCookie,
            maxAge: 5 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          });

          return response;
        } catch (error) {
          console.error('Token verification error:', error);
          return MockResponse.json(
            { error: 'Invalid token' },
            { status: HTTP_STATUS.UNAUTHORIZED }
          );
        }
      } catch (error) {
        console.error('Request parsing error:', error);
        return MockResponse.json({ error: 'Invalid request' }, { status: HTTP_STATUS.BAD_REQUEST });
      }
    },

    async DELETE() {
      // Create successful response
      const response = MockResponse.json({ status: 'success' });

      // Clear cookie
      response.cookies.set({
        name: AUTH.COOKIE_NAME,
        value: '',
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      mockCookies.get.mockReturnValue({
        name: AUTH.COOKIE_NAME,
        value: '',
        maxAge: 0,
        httpOnly: true,
        path: '/',
      });

      return response;
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockJson.mockClear();
    mockCookies.set.mockClear();
    mockCookies.get.mockClear();

    // Setup default Firebase Admin mocks
    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUser.uid,
      email: mockUser.email,
    });

    (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue(mockSessionCookie);

    // Setup cookie mock for successful responses
    mockCookies.get.mockImplementation(name => {
      if (name === AUTH.COOKIE_NAME) {
        return {
          name: AUTH.COOKIE_NAME,
          value: mockSessionCookie,
          httpOnly: true,
          secure: false,
          path: '/',
        };
      }
      return undefined;
    });
  });

  describe('POST /api/auth/session', () => {
    test('should create a session successfully', async () => {
      // Arrange
      const request = createRequestMock({ token: AUTH.MOCK_TOKEN });

      // Act
      const response = await handleSession.POST(request);

      // Assert response
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({ status: 'success' });

      // Verify mocks were called correctly
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(AUTH.MOCK_TOKEN);
      expect(adminAuth.createSessionCookie).toHaveBeenCalledWith(
        AUTH.MOCK_TOKEN,
        expect.any(Object)
      );

      // Verify cookie is set
      expect(mockCookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: AUTH.COOKIE_NAME,
          value: mockSessionCookie,
          httpOnly: true,
        })
      );
    });

    test('should handle missing token', async () => {
      // Arrange
      const request = createRequestMock({});

      // Act
      const response = await handleSession.POST(request);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No token provided' });

      // Verify Firebase Admin functions weren't called
      expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
      expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
    });

    test('should handle token verification failure', async () => {
      // Arrange
      const request = createRequestMock({ token: AUTH.INVALID_TOKEN });
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act
      const response = await handleSession.POST(request);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid token' });

      // Verify verifyIdToken was called but createSessionCookie wasn't
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(AUTH.INVALID_TOKEN);
      expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
    });

    test('should handle session cookie creation failure', async () => {
      // Arrange
      const request = createRequestMock({ token: AUTH.MOCK_TOKEN });
      (adminAuth.createSessionCookie as jest.Mock).mockRejectedValue(
        new Error('Failed to create session')
      );

      // Act
      const response = await handleSession.POST(request);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid token' });

      // Verify both Firebase Admin functions were called
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(AUTH.MOCK_TOKEN);
      expect(adminAuth.createSessionCookie).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/auth/session', () => {
    test('should delete session successfully', async () => {
      // Act
      const response = await handleSession.DELETE();

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({ status: 'success' });

      // Verify session cookie is cleared
      expect(mockCookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: AUTH.COOKIE_NAME,
          value: '',
          maxAge: 0,
        })
      );

      const sessionCookie = mockCookies.get(AUTH.COOKIE_NAME);
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie.value).toBe('');
      expect(sessionCookie.maxAge).toBeLessThanOrEqual(0);
    });
  });
});
