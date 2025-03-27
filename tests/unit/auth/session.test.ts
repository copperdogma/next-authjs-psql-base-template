import { NextRequest } from 'next/server';
import { POST, DELETE } from '../../../app/api/auth/session/route';

// Mock Firebase Admin Auth
jest.mock('../../../lib/firebase-admin', () => {
  // Create a mock Firebase auth object with functions that return resolved promises
  const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: 'test-uid' });
  const mockCreateSessionCookie = jest.fn().mockResolvedValue('test-session-cookie');
  const mockVerifySessionCookie = jest.fn().mockResolvedValue({ uid: 'test-uid' });
  const mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined);

  return {
    auth: {
      verifyIdToken: mockVerifyIdToken,
      createSessionCookie: mockCreateSessionCookie,
      verifySessionCookie: mockVerifySessionCookie,
      revokeRefreshTokens: mockRevokeRefreshTokens,
    },
  };
});

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  const jsonMock = jest.fn().mockImplementation((data, options) => {
    const response = {
      ...originalModule.NextResponse.json({}, {}),
      cookies: {
        set: jest.fn(),
      },
      status: options?.status || 200,
    };
    return response;
  });

  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jsonMock,
    },
  };
});

// Mock session module
jest.mock('../../../lib/auth/session', () => ({
  SESSION_COOKIE_NAME: 'session',
  getSessionCookieOptions: jest.fn().mockReturnValue({
    maxAge: 3600,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  }),
  createSessionCookie: jest.fn().mockImplementation(async token => {
    return 'mock-session-cookie';
  }),
  verifySessionCookie: jest.fn(),
}));

describe('Session API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/session', () => {
    it('should verify the token and create a session cookie with correct security settings', async () => {
      // Mock request data
      const mockToken = 'mock-firebase-token';
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: mockToken }),
        cookies: {
          get: jest.fn(),
        },
      } as unknown as NextRequest;

      // Call the API
      const response = await POST(mockRequest);

      // Verify response was created
      expect(response.status).toBe(200);

      // Verify cookie was set with proper security settings
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'session',
          httpOnly: true,
          path: '/',
        })
      );
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('should clear the session cookie', async () => {
      // Mock request
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'test-session-cookie' }),
        },
      } as unknown as NextRequest;

      // Call the API
      const response = await DELETE(mockRequest);

      // Verify response was created
      expect(response.status).toBe(200);

      // Verify cookie was cleared
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'session',
          value: '',
          maxAge: 0,
          httpOnly: true,
        })
      );
    });
  });
});
