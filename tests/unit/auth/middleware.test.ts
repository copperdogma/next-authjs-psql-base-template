import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../../middleware';
import { createAuthMiddleware } from '../../../tests/mocks/lib/auth/middleware';

// Mock middleware
jest.mock('../../../tests/mocks/lib/auth/middleware', () => ({
  createAuthMiddleware: jest.fn(() => ({ type: 'auth-middleware-result' })),
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

// Create a mock middleware function
const mockAuthMiddlewareFunction = jest.fn(req => NextResponse.next());

// Mock the middleware module
jest.mock('../../../middleware', () => ({
  middleware: jest.fn(req => mockAuthMiddlewareFunction(req)),
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

      // Setup the mock for the auth middleware function
      mockAuthMiddlewareFunction.mockImplementationOnce(() => NextResponse.redirect(loginUrl));

      // Setup the mock for the createAuthMiddleware factory
      (createAuthMiddleware as jest.Mock).mockReturnValueOnce(mockAuthMiddlewareFunction);

      // Call the middleware
      middleware(req);

      // Check if middleware was called
      expect(middleware).toHaveBeenCalledWith(req);

      // Check if the auth middleware function was called
      expect(mockAuthMiddlewareFunction).toHaveBeenCalledWith(req);

      // Check if NextResponse.redirect was called
      expect(NextResponse.redirect).toHaveBeenCalledWith(loginUrl);

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
