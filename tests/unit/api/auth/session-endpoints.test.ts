import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from '../../../../app/api/auth/session/route';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '../../../../lib/auth/session';

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock Firebase Admin
jest.mock('../../../../lib/firebase-admin', () => {
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

jest.mock('../../../../lib/auth/session', () => {
  const originalModule = jest.requireActual('../../../../lib/auth/session');
  return {
    ...originalModule,
    createSessionCookie: jest.fn().mockResolvedValue('mocked-session-cookie'),
    verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
  };
});

describe('Session API Endpoints Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/session', () => {
    it('should set a secure session cookie in the response', async () => {
      // Create mock request with token
      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'valid-firebase-token' }),
      });

      // Get API response
      const response = await POST(request);

      // Extract cookie from response
      const setCookieHeader = response.headers.get('Set-Cookie');

      // Verify cookie contains security attributes
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain(SESSION_COOKIE_NAME);
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('SameSite=lax');

      // In production, should have Secure flag
      if (process.env.NODE_ENV === 'production') {
        expect(setCookieHeader).toContain('Secure');
      }
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('should clear the session cookie securely when logging out', async () => {
      // Create mock request
      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'DELETE',
      });

      // Mock cookies
      Object.defineProperty(request, 'cookies', {
        value: {
          get: jest.fn().mockReturnValue({ value: 'test-session-cookie' }),
        },
        configurable: true,
      });

      // Get API response
      const response = await DELETE(request);

      // Extract cookie from response
      const setCookieHeader = response.headers.get('Set-Cookie');

      // Verify cookie is being cleared
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain(SESSION_COOKIE_NAME);
      expect(setCookieHeader).toContain('Max-Age=0'); // Cookie expiration

      // Should still have security attributes when clearing
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Path=/');
    });
  });
});
