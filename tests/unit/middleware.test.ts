import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../../middleware';

// Define paths locally for testing purposes, mirroring middleware logic
const testPublicPaths = [
  '/',
  '/login',
  '/about',
  '/api/health',
  // '/api/auth/**', // Wildcards are harder to test exhaustively here
  // '/api/log/client',
  // '/api/test/**',
];
const testProtectedPaths = ['/dashboard', '/profile', '/settings'];

// Mock the NextAuth getToken function
jest.mock('next-auth/jwt');
const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Mock logger to prevent actual logging during tests
jest.mock('../lib/logger', () => ({
  loggers: {
    middleware: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn().mockReturnThis(), // Allow chaining like .child().info()
    },
  },
  getRequestId: jest.fn(() => 'test-request-id'),
}));

// Helper function to create a mock NextRequest
function createMockRequest(path: string, search: string = ''): NextRequest {
  const url = `http://localhost:3000${path}${search ? `?${search}` : ''}`;
  return new NextRequest(url);
}

describe('Middleware Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedGetToken.mockClear();
    // Clear mock logger calls if needed (example)
    // const mockLogger = require('@/lib/logger').loggers.middleware;
    // mockLogger.info.mockClear();
  });

  describe('Unauthenticated User Access', () => {
    beforeEach(() => {
      // Simulate an unauthenticated user
      mockedGetToken.mockResolvedValue(null);
    });

    test.each(testPublicPaths)('should allow access to public path: %s', async (path: string) => {
      const request = createMockRequest(path);
      const response = await middleware(request);
      // Expect no redirection (status 200 or allow NextResponse.next())
      // NextResponse.next() doesn't have a status directly, check for redirect headers
      expect(response.headers.get('location')).toBeNull();
    });

    test.each(testProtectedPaths)(
      'should redirect access to protected path: %s to /login',
      async (path: string) => {
        const request = createMockRequest(path);
        const response = await middleware(request);
        expect(response.status).toBe(307); // Check for redirect status
        const location = response.headers.get('location');
        expect(location).not.toBeNull();
        const redirectUrl = new URL(location!); // Assert not null
        expect(redirectUrl.pathname).toBe('/login');
        expect(redirectUrl.searchParams.get('callbackUrl')).toBe(path);
      }
    );

    test('should include search params in callbackUrl on redirect', async () => {
      const path = '/dashboard';
      const search = 'param1=value1&param2=value2';
      const request = createMockRequest(path, search);
      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).not.toBeNull();
      const redirectUrl = new URL(location!); // Assert not null
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe(`${path}?${search}`);
    });
  });

  describe('Authenticated User Access', () => {
    beforeEach(() => {
      // Simulate an authenticated user
      mockedGetToken.mockResolvedValue({
        sub: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });
    });

    test.each(testPublicPaths.filter(p => p !== '/login'))(
      'should allow access to public path: %s',
      async (path: string) => {
        const request = createMockRequest(path);
        const response = await middleware(request);
        expect(response.headers.get('location')).toBeNull();
      }
    );

    test.each(testProtectedPaths)(
      'should allow access to protected path: %s',
      async (path: string) => {
        const request = createMockRequest(path);
        const response = await middleware(request);
        expect(response.headers.get('location')).toBeNull();
      }
    );

    test('should redirect access to /login path to /dashboard', async () => {
      const request = createMockRequest('/login');
      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).not.toBeNull();
      const redirectUrl = new URL(location!); // Assert not null
      expect(redirectUrl.pathname).toBe('/dashboard');
    });
  });

  // Note: Wildcard paths like /api/auth/** are difficult to test Exhaustively
  // in unit tests without more complex mocking of the underlying request handling.
  // E2E tests provide better coverage for these.
});
