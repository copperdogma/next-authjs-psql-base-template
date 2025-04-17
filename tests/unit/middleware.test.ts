import { NextRequest, NextResponse } from 'next/server';
import middleware from '../../middleware';
import { config as middlewareConfig } from '../../middleware';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { pino } from 'pino';
import type { Session, User } from 'next-auth';

// Define paths locally for testing purposes, mirroring middleware logic
const testPublicPaths = ['/', '/login', '/about', '/api/health'];
const testProtectedPaths = ['/dashboard', '/profile', '/settings'];

// Mock the auth wrapper from @/lib/auth
const mockAuth = jest.fn();
const mockAuthLib = {
  // Mock the functions/objects exported by your actual @/lib/auth
  auth: mockAuth,
  // Add other named exports if they exist and are needed, otherwise omit
  // handlers: { GET: jest.fn(), POST: jest.fn() },
  // signIn: jest.fn(),
  // signOut: jest.fn(),
  // createContextLogger: jest.fn(), // Assuming this might be exported too
};
jest.mock('@/lib/auth', () => mockAuthLib);

// Mock logger to prevent actual logging during tests
jest.mock('../lib/logger', () => ({
  loggers: {
    middleware: {
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
      }),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    },
  },
  getRequestId: jest.fn().mockReturnValue('test-request-id'),
}));

// Mock NextResponse methods globally for simplicity in verifying redirects/next
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(url => ({
      status: 307,
      headers: { get: (h: string) => (h === 'location' ? url.toString() : null) },
    })),
    next: jest.fn(() => ({ status: 200, headers: { get: () => null } })),
  },
  // Keep NextRequest mock if needed, or use actual NextRequest
  NextRequest: jest.requireActual('next/server').NextRequest,
}));

// Helper function to create a mock NextRequest
function createMockRequest(path: string, search: string = ''): NextRequest {
  const url = `http://localhost:3000${path}${search ? `?${search}` : ''}`;
  return new NextRequest(url);
}

describe('Middleware Unit Tests (Auth.js v5)', () => {
  beforeEach(() => {
    mockAuth.mockClear();
    // Reset NextResponse mocks
    (NextResponse.redirect as jest.Mock).mockClear();
    (NextResponse.next as jest.Mock).mockClear();
  });

  // --- Test Setup ---
  const mockAuthenticatedUser: User & { role: string } = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
  };
  const mockAuthenticatedSession: Session = {
    user: mockAuthenticatedUser,
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  };

  // Simulate how the auth() wrapper modifies the request and calls the inner function
  const setupMockAuth = (isAuthenticated: boolean) => {
    mockAuth.mockImplementation(
      (middlewareFn: (req: NextRequest & { auth: Session | null }) => Promise<NextResponse>) => {
        return async (request: NextRequest) => {
          const augmentedRequest = request as NextRequest & { auth: Session | null };
          augmentedRequest.auth = isAuthenticated ? mockAuthenticatedSession : null;

          // Simulate Auth.js default redirect behavior
          const pathname = request.nextUrl.pathname;
          // Use simplified local check for protected paths
          const isProtectedRoute = testProtectedPaths.some(p => pathname.startsWith(p));
          const isLoginPage = pathname === '/login';

          if (isProtectedRoute && !isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            // Ensure search parameters are handled correctly
            const searchParams = request.nextUrl.search;
            loginUrl.searchParams.set('callbackUrl', pathname + searchParams);
            return NextResponse.redirect(loginUrl);
          }
          if (isLoginPage && isAuthenticated) {
            const dashboardUrl = new URL('/dashboard', request.url);
            return NextResponse.redirect(dashboardUrl);
          }

          // Expect NextResponse.next() if no redirect
          return NextResponse.next();
        };
      }
    );
  };

  describe('Unauthenticated User Access', () => {
    beforeEach(() => {
      setupMockAuth(false); // Configure mockAuth for unauthenticated
    });

    test.each(testPublicPaths)('should allow access to public path: %s', async (path: string) => {
      const request = createMockRequest(path);
      await middleware(request); // Call the wrapped middleware
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(mockAuth).toHaveBeenCalled();
    });

    test.each(testProtectedPaths)(
      'should redirect access to protected path: %s to /login',
      async (path: string) => {
        const request = createMockRequest(path);
        const response = await middleware(request);
        expect(NextResponse.next).not.toHaveBeenCalled();
        expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
        const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
        expect(redirectUrl.pathname).toBe('/login');
        expect(redirectUrl.searchParams.get('callbackUrl')).toBe(path);
        expect(mockAuth).toHaveBeenCalled();
      }
    );

    test('should include search params in callbackUrl on redirect', async () => {
      const path = '/dashboard';
      const search = 'param1=value1&param2=value2';
      const request = createMockRequest(path, search);
      await middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe(`${path}?${search}`);
    });
  });

  describe('Authenticated User Access', () => {
    beforeEach(() => {
      setupMockAuth(true); // Configure mockAuth for authenticated
    });

    test.each(testPublicPaths.filter(p => p !== '/login'))(
      'should allow access to public path: %s',
      async (path: string) => {
        const request = createMockRequest(path);
        await middleware(request);
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalledTimes(1);
        expect(mockAuth).toHaveBeenCalled();
      }
    );

    test.each(testProtectedPaths)(
      'should allow access to protected path: %s',
      async (path: string) => {
        const request = createMockRequest(path);
        await middleware(request);
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalledTimes(1);
        expect(mockAuth).toHaveBeenCalled();
      }
    );

    test('should redirect access to /login path to /dashboard', async () => {
      const request = createMockRequest('/login');
      await middleware(request);
      expect(NextResponse.next).not.toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/dashboard');
      expect(mockAuth).toHaveBeenCalled();
    });
  });
});
