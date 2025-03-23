import { NextRequest, NextResponse } from 'next/server';
import { createAuthMiddleware, AuthMiddlewareOptions } from '../../../lib/auth/middleware';

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
        if (name === 'session' && !url.includes('no-auth')) {
          return { name: 'session', value: 'mock-session-token' };
        }
        return undefined;
      }),
    },
  })),
}));

describe('Auth Middleware Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuthMiddleware', () => {
    it('should create middleware with default options if none provided', () => {
      const middleware = createAuthMiddleware();
      expect(middleware).toBeInstanceOf(Function);
    });

    it('should merge provided options with defaults', () => {
      const customOptions: Partial<AuthMiddlewareOptions> = {
        loginPath: '/custom-login',
        defaultAuthenticatedRedirect: '/custom-dashboard',
      };

      const middleware = createAuthMiddleware(customOptions);

      // Test redirection to custom login path
      const unauthRequest = new NextRequest('http://localhost:3000/dashboard/no-auth');
      middleware(unauthRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/custom-login');
    });
  });

  describe('authMiddleware behavior', () => {
    const middleware = createAuthMiddleware();

    it('should redirect unauthenticated users to login from protected routes', () => {
      const request = new NextRequest('http://localhost:3000/dashboard/no-auth');
      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe(
        'http://localhost:3000/dashboard/no-auth'
      );
    });

    it('should allow authenticated users to access protected routes', () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect authenticated users from public routes to dashboard', () => {
      const request = new NextRequest('http://localhost:3000/login');
      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/dashboard');
    });

    it('should allow unauthenticated users to access public routes', () => {
      const request = new NextRequest('http://localhost:3000/login/no-auth');
      middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should allow access to unspecified routes regardless of auth status', () => {
      // Unauthenticated user on unspecified route
      const unauthRequest = new NextRequest('http://localhost:3000/about/no-auth');
      middleware(unauthRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      jest.clearAllMocks();

      // Authenticated user on unspecified route
      const authRequest = new NextRequest('http://localhost:3000/about');
      middleware(authRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
