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
