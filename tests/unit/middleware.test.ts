import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../../middleware';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config as middlewareConfig } from '../../middleware'; // Import the config from your middleware file
import type { NextConfig } from 'next';
import {
  isPublic,
  handleSkippableRoutes,
  // Need to import the actual middleware to potentially get path arrays
  // Or redefine them here if they aren't exported
} from '../../middleware';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { pino } from 'pino';

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

describe('Middleware with TokenService Dependency Injection', () => {
  // Mock dependencies
  const mockUserData = {
    sub: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  // Create mock token service
  const mockTokenService = {
    getToken: jest.fn(),
  };

  // Mock NextResponse
  const mockNextResponseNext = jest.fn().mockReturnValue({
    headers: new Headers(),
  });
  const mockNextResponseRedirect = jest.fn().mockReturnValue({
    headers: new Headers(),
  });

  // Save original implementations
  const originalNext = NextResponse.next;
  const originalRedirect = NextResponse.redirect;

  beforeAll(() => {
    // Mock NextResponse methods
    NextResponse.next = mockNextResponseNext;
    NextResponse.redirect = mockNextResponseRedirect;
  });

  afterAll(() => {
    // Restore original implementation
    NextResponse.next = originalNext;
    NextResponse.redirect = originalRedirect;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access to public routes without authentication', async () => {
    // Set up token service to return null (no auth)
    mockTokenService.getToken.mockResolvedValue(null);

    // Create mock request for public route
    const mockRequest = new NextRequest('http://localhost/', {
      method: 'GET',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was called
    expect(mockTokenService.getToken).toHaveBeenCalledWith({ req: mockRequest });

    // Verify NextResponse.next was called (allowing the request)
    expect(mockNextResponseNext).toHaveBeenCalled();

    // Verify NextResponse.redirect was not called
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users from protected routes to login', async () => {
    // Set up token service to return null (no auth)
    mockTokenService.getToken.mockResolvedValue(null);

    // Create mock request for protected route
    const mockRequest = new NextRequest('http://localhost/dashboard', {
      method: 'GET',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was called
    expect(mockTokenService.getToken).toHaveBeenCalledWith({ req: mockRequest });

    // Verify NextResponse.redirect was called with login URL
    expect(mockNextResponseRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
  });

  it('should allow authenticated users to access protected routes', async () => {
    // Set up token service to return user data (authenticated)
    mockTokenService.getToken.mockResolvedValue(mockUserData);

    // Create mock request for protected route
    const mockRequest = new NextRequest('http://localhost/dashboard', {
      method: 'GET',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was called
    expect(mockTokenService.getToken).toHaveBeenCalledWith({ req: mockRequest });

    // Verify NextResponse.next was called (allowing the request)
    expect(mockNextResponseNext).toHaveBeenCalled();

    // Verify NextResponse.redirect was not called
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it('should redirect authenticated users from login to dashboard', async () => {
    // Set up token service to return user data (authenticated)
    mockTokenService.getToken.mockResolvedValue(mockUserData);

    // Create mock request for login page
    const mockRequest = new NextRequest('http://localhost/login', {
      method: 'GET',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was called
    expect(mockTokenService.getToken).toHaveBeenCalledWith({ req: mockRequest });

    // Verify NextResponse.redirect was called with dashboard URL
    expect(mockNextResponseRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    );
  });

  it('should skip auth processing for API routes', async () => {
    // Create mock request for API route
    const mockRequest = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was not called
    expect(mockTokenService.getToken).not.toHaveBeenCalled();

    // Verify NextResponse.next was called (allowing the request)
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Set up token service to throw error
    const mockError = new Error('Token service error');
    mockTokenService.getToken.mockRejectedValue(mockError);

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/dashboard', {
      method: 'GET',
    });

    // Call middleware with injected token service
    await middleware(mockRequest, mockTokenService);

    // Verify token service was called
    expect(mockTokenService.getToken).toHaveBeenCalledWith({ req: mockRequest });

    // Verify NextResponse.next was called (default fallback response)
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  it('should use default token service if none is provided', async () => {
    // Create a spy on getToken from next-auth/jwt
    const getTokenSpy = jest.spyOn(require('next-auth/jwt'), 'getToken');
    getTokenSpy.mockResolvedValue(null);

    // Create mock request for public route
    const mockRequest = new NextRequest('http://localhost/', {
      method: 'GET',
    });

    // Call middleware without injected token service
    await middleware(mockRequest);

    // Verify the default token service was used
    expect(getTokenSpy).toHaveBeenCalledWith({ req: mockRequest });

    // Cleanup
    getTokenSpy.mockRestore();
  });
});

describe('Middleware Path Matching', () => {
  // Define test cases: [url, expectedResult]
  const testCases: [string, boolean][] = [
    // Paths that SHOULD match based on middlewareConfig.matcher
    // Assuming matcher includes things like /dashboard, /profile, etc.
    // NOTE: Update these based on the actual matcher in middleware.ts
    ['/dashboard', true],
    ['/profile', true],
    ['/profile/settings', true],
    ['/settings', true], // Added this based on protectedPaths in middleware.ts

    // Paths that SHOULD NOT match
    ['/', false], // Assuming '/' is public and not explicitly matched for middleware execution
    ['/about', false],
    ['/login', false],
    ['/api/health', false], // API routes are often excluded or handled differently
    ['/api/auth/signin', false],
    ['/_next/static/css/styles.css', false],
    ['/favicon.ico', false],
    ['/image.png', false],
  ];

  testCases.forEach(([url, expectedResult]) => {
    it(`should${expectedResult ? '' : ' not'} match URL: ${url}`, () => {
      const result = unstable_doesMiddlewareMatch({
        config: middlewareConfig,
        nextConfig: mockNextConfig,
        url: url,
        // headers and cookies can be added if matcher depends on them
      });
      expect(result).toBe(expectedResult);
    });
  });

  // Add specific tests for wildcard paths if used in matcher
  // Example: if matcher is '/api/:path*'
  it('should match wildcard API paths if configured', () => {
    // Adjust this test based on the actual matcher config
    const apiMatcherConfig = { matcher: '/api/:path*' }; // Example config
    expect(
      unstable_doesMiddlewareMatch({
        config: apiMatcherConfig, // Use specific config for this test
        nextConfig: mockNextConfig,
        url: '/api/users/123',
      })
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({
        config: apiMatcherConfig,
        nextConfig: mockNextConfig,
        url: '/api/posts',
      })
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({
        config: apiMatcherConfig,
        nextConfig: mockNextConfig,
        url: '/users/123', // Should not match
      })
    ).toBe(false);
  });
});

// Mock nextConfig if needed by unstable_doesMiddlewareMatch
const mockNextConfig: NextConfig = {
  // Add any necessary mock config properties here if required by the matcher logic
  // For simple path matching, an empty object might suffice
};

describe('Middleware Helper Functions', () => {
  beforeEach(() => {
    mockReset(mockLogger);
  });

  describe('isPublic', () => {
    // Test cases based on the arrays defined above
    const testCases: [string, boolean][] = [
      // Public paths
      ['/', true],
      ['/login', true],
      ['/about', true],
      ['/api/health', true],
      ['/api/auth/signin', true], // Wildcard match
      ['/api/auth/callback/google', true], // Wildcard match
      ['/api/log/client', true],
      ['/api/test/some-test', true], // Wildcard match

      // Protected paths
      ['/dashboard', false],
      ['/profile', false],
      ['/settings', false],
      ['/profile/advanced', false], // Subpath of protected

      // Static assets & internal routes (should be treated as public/skippable)
      ['/_next/static/css/styles.css', true],
      ['/favicon.ico', true],
      ['/image.png', true],
      ['/manifest.json', true],

      // Unknown paths (should default to protected based on current logic)
      ['/unknown', false],
      ['/other/path', false],

      // --- Edge Cases ---
      ['/dashboard/', false], // Protected with trailing slash
      ['/login/', true], // Public with trailing slash
      ['/about?query=param', true], // Public with query params (should ignore params)
      ['/profile?user=1', false], // Protected with query params
      ['/file-without-extension', false], // Unknown, treated as protected
      ['/api/auth/', true], // Wildcard base path
      ['/API/health', true], // Case sensitivity (depends on matching logic, assuming case-sensitive URL here)
    ];

    testCases.forEach(([pathname, expectedResult]) => {
      it(`should return ${expectedResult} for path: ${pathname}`, () => {
        // We need to mock the imported arrays if they are not exported
        // For now, assuming the local definition matches the middleware file
        expect(isPublic(pathname)).toBe(expectedResult);
      });
    });
  });

  describe('handleSkippableRoutes', () => {
    it('should return NextResponse.next() for API routes and log debug', () => {
      const pathname = '/api/users';
      const response = handleSkippableRoutes(pathname, mockLogger);
      expect(response).toBeInstanceOf(NextResponse);
      // Check if NextResponse.next() was effectively called (difficult to check directly)
      // We can infer it if the response isn't null and has default headers/status
      expect(response?.status).toBe(200); // Default status for NextResponse.next()
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Skipping API route' });
    });

    it('should return NextResponse.next() for static assets and log debug', () => {
      const testCases = [
        '/_next/static/chunks/main.js',
        '/logo.svg',
        '/favicon.ico',
        '/data.json',
        '/robots.txt',
      ];
      testCases.forEach(pathname => {
        mockLogger.debug.mockClear(); // Clear mock before each case
        const response = handleSkippableRoutes(pathname, mockLogger);
        expect(response).toBeInstanceOf(NextResponse);
        expect(response?.status).toBe(200);
        expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Skipping static asset' });
      });
    });

    it('should return null for non-skippable routes', () => {
      const testCases = [
        '/',
        '/dashboard',
        '/about',
        '/profile/settings',
        '/some/random/path',
        '/file-without-extension',
      ];
      testCases.forEach(pathname => {
        mockLogger.debug.mockClear(); // Clear mock before each case
        const response = handleSkippableRoutes(pathname, mockLogger);
        expect(response).toBeNull();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });
    });

    it('should still skip API routes even with extensions (if logic is startsWith)', () => {
      const pathname = '/api/users.json';
      const response = handleSkippableRoutes(pathname, mockLogger);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(200);
      expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'Skipping API route' });
    });
  });
});

// Mock logger for handleSkippableRoutes
const mockLogger = mockDeep<pino.Logger>();

// Re-define path arrays used by isPublic (if not exported from middleware.ts)
const publicPaths = [
  '/',
  '/login',
  '/about',
  '/api/health',
  '/api/auth/**',
  '/api/log/client',
  '/api/test/**',
];
const protectedPaths = ['/dashboard', '/profile', '/settings'];
