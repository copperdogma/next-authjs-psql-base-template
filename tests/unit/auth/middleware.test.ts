import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../../middleware';
import { authMiddleware } from '../../../lib/auth/middleware';

// Mock authMiddleware
jest.mock('../../../lib/auth/middleware', () => ({
  authMiddleware: jest.fn(() => ({ type: 'auth-middleware-result' })),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(() => ({ type: 'redirect' })),
    next: jest.fn(() => ({ type: 'next' })),
  },
  NextRequest: jest.fn().mockImplementation(url => ({
    nextUrl: new URL(url),
    url,
    cookies: {
      get: jest.fn().mockImplementation(name => {
        if (name === 'session' && !url.includes('no-session')) {
          return { name: 'session', value: 'mock-session-token' };
        }
        return undefined;
      }),
    },
  })),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('URL encoding', () => {
    it('should properly encode the callbackUrl parameter without double encoding', () => {
      // Create a request for a protected route without a session
      const req = new NextRequest('http://localhost:3000/dashboard?no-session=true');

      // Create the URL object for login
      const loginUrl = new URL('/login', 'http://localhost:3000');
      loginUrl.searchParams.set('callbackUrl', 'http://localhost:3000/dashboard?no-session=true');

      // Setup the mock
      (NextResponse.redirect as jest.Mock).mockReturnValueOnce({ type: 'redirect' });
      (authMiddleware as jest.Mock).mockImplementationOnce(() => {
        return NextResponse.redirect(loginUrl);
      });

      // Call the middleware
      middleware(req);

      // Check if authMiddleware was called
      expect(authMiddleware).toHaveBeenCalled();

      // Check if NextResponse.redirect was called
      expect(NextResponse.redirect).toHaveBeenCalled();

      // Get the URL that was passed to redirect
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];

      // Parse the URL to check the callbackUrl parameter
      const url = new URL(redirectUrl);
      const callbackUrlParam = url.searchParams.get('callbackUrl');

      // The callbackUrl should be the full URL properly encoded
      expect(callbackUrlParam).toBe('http://localhost:3000/dashboard?no-session=true');

      // Make sure there are no double-encoded characters like %253A (which would be %3A double-encoded)
      expect(callbackUrlParam).not.toContain('%25');
    });
  });
});
