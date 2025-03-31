import { NextRequest, NextResponse } from 'next/server';
import {
  createAuthMiddleware,
  AuthMiddlewareOptions,
} from '../../../tests/mocks/lib/auth/middleware';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn().mockImplementation(url => ({ type: 'redirect', url })),
    next: jest.fn().mockReturnValue({ type: 'next' }),
  },
  NextRequest: jest.fn().mockImplementation(url => ({
    nextUrl: new URL(url),
    url,
    cookies: {
      has: jest.fn().mockImplementation(name => {
        if (name === 'mock-auth-cookie' && !url.includes('unauthenticated')) {
          return true;
        }
        return false;
      }),
    },
  })),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default options when none provided', () => {
      const middleware = createAuthMiddleware();
      expect(middleware).toBeDefined();
    });

    it('should accept custom options', () => {
      const customOptions: AuthMiddlewareOptions = {
        protectedRoutes: ['/custom-protected'],
        publicRoutes: ['/custom-public'],
        loginUrl: '/custom-login',
        defaultLoggedInRedirect: '/custom-dashboard',
      };

      const middleware = createAuthMiddleware(customOptions);
      expect(middleware).toBeDefined();
    });
  });

  describe('Authentication Flow', () => {
    it('should allow access to public routes without auth', async () => {
      const req = new NextRequest('http://localhost:3000/api/health');
      const middleware = createAuthMiddleware({
        publicRoutes: ['/api/health'],
      });

      const result = await middleware(req);

      expect(result.type).toBe('next');
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should redirect unauthenticated users to login when accessing protected routes', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard?unauthenticated=true');
      const middleware = createAuthMiddleware();

      const result = await middleware(req);

      expect(result.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();

      // Get the URL from the mock call
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];

      // Check if it's redirecting to login with callback URL
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/dashboard');
    });

    it('should redirect authenticated users away from login page', async () => {
      const req = new NextRequest('http://localhost:3000/login');
      // Mock the cookies.has to return true for this test
      req.cookies.has = jest.fn().mockReturnValue(true);

      const middleware = createAuthMiddleware();

      const result = await middleware(req);

      expect(result.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();

      // Get the URL from the mock call
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];

      // Should redirect to dashboard
      expect(redirectUrl.pathname).toBe('/dashboard');
    });

    it('should allow authenticated users to access protected routes', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard');
      // Test as if user is authenticated
      req.cookies.has = jest.fn().mockReturnValue(true);

      const middleware = createAuthMiddleware();

      const result = await middleware(req);

      expect(result.type).toBe('next');
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Custom Routes', () => {
    it('should respect custom protected routes', async () => {
      const req = new NextRequest('http://localhost:3000/custom-area?unauthenticated=true');

      const middleware = createAuthMiddleware({
        protectedRoutes: ['/custom-area'],
      });

      const result = await middleware(req);

      expect(result.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('should respect custom public routes', async () => {
      const req = new NextRequest('http://localhost:3000/public-content');

      const middleware = createAuthMiddleware({
        protectedRoutes: ['/dashboard', '/profile'], // Default protected routes
        publicRoutes: ['/public-content'], // Custom public route
      });

      const result = await middleware(req);

      expect(result.type).toBe('next');
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});
