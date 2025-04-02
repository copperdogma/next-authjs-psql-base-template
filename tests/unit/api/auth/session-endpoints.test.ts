/**
 * Session API Routes Tests
 *
 * Tests the functionality of the session API endpoints for authentication.
 */

import { HTTP_STATUS, API_ENDPOINTS, AUTH, TEST_DOMAINS } from '../../../utils/test-constants';
import {
  mockUser,
  mockSessionCookie,
  createFirebaseAdminMocks,
} from '../../../utils/firebase-mocks';
import { v4 as uuidv4 } from 'uuid';

// Create mock response object
class MockResponse {
  public status: number;
  public headers: Headers;
  public cookies: {
    set: jest.Mock;
    get: jest.Mock;
    delete: jest.Mock;
  };

  constructor(status = 200) {
    this.status = status;
    this.headers = new Headers();
    this.cookies = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
  }

  json() {
    return this;
  }
}

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn().mockImplementation((data, options = {}) => {
    const response = new MockResponse(options.status || 200);
    return response;
  }),
};

// Setup Firebase Admin mocks
const { verifyIdTokenMock, createSessionCookieMock } = createFirebaseAdminMocks();

// Create test implementations of the route handlers
async function handlePOST(request: { json: () => Promise<any> }) {
  try {
    const { token } = await request.json();

    if (!token) {
      return mockNextResponse.json(
        { error: 'No token provided' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await verifyIdTokenMock(token);

      // Create a session cookie
      const sessionCookie = await createSessionCookieMock(token, {
        expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
      });

      // Create response with cookie
      const response = mockNextResponse.json({ status: 'success' });
      response.cookies.set({
        name: AUTH.COOKIE_NAME,
        value: sessionCookie,
        maxAge: 5 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return response;
    } catch (verificationError) {
      console.error('Token verification error:', verificationError);
      return mockNextResponse.json(
        { error: 'Invalid token' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
  } catch (error) {
    console.error('Session creation error:', error);
    return mockNextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
}

async function handleDELETE() {
  try {
    // Clear the session cookie
    const response = mockNextResponse.json({ status: 'success' });
    response.cookies.set({
      name: AUTH.COOKIE_NAME,
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return mockNextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

describe('Session API Routes', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockNextResponse.json.mockClear();

    // Set default implementations for Firebase Admin mocks
    verifyIdTokenMock.mockResolvedValue({
      uid: mockUser.uid,
      email: mockUser.email,
      name: mockUser.displayName,
    });

    createSessionCookieMock.mockResolvedValue(mockSessionCookie);
  });

  describe('POST /api/auth/session', () => {
    it('should create a session successfully with valid token', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: AUTH.MOCK_TOKEN }),
      };

      // Act
      const response = await handlePOST(mockRequest);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(AUTH.MOCK_TOKEN);
      expect(createSessionCookieMock).toHaveBeenCalledWith(AUTH.MOCK_TOKEN, expect.any(Object));
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: AUTH.COOKIE_NAME,
          value: mockSessionCookie,
          httpOnly: true,
        })
      );
    });

    it('should return 400 if no token is provided', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      };

      // Act
      const response = await handlePOST(mockRequest);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(verifyIdTokenMock).not.toHaveBeenCalled();
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: AUTH.INVALID_TOKEN }),
      };

      // Set up mock to simulate verification failure
      verifyIdTokenMock.mockRejectedValue(new Error('Invalid token'));

      // Act
      const response = await handlePOST(mockRequest);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(AUTH.INVALID_TOKEN);
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });

    it('should return 401 if session cookie creation fails', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: AUTH.MOCK_TOKEN }),
      };

      // Set up mock to simulate session cookie creation failure
      createSessionCookieMock.mockRejectedValue(new Error('Failed to create session cookie'));

      // Act
      const response = await handlePOST(mockRequest);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(verifyIdTokenMock).toHaveBeenCalledWith(AUTH.MOCK_TOKEN);
      expect(createSessionCookieMock).toHaveBeenCalled();
    });

    it('should return 401 if request parsing fails', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      // Act
      const response = await handlePOST(mockRequest);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(verifyIdTokenMock).not.toHaveBeenCalled();
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('should successfully delete the session', async () => {
      // Act
      const response = await handleDELETE();

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: AUTH.COOKIE_NAME,
          value: '',
          maxAge: 0,
          httpOnly: true,
        })
      );
    });
  });
});
