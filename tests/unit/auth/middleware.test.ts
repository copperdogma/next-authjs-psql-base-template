import { NextRequest as NextReq, NextResponse } from 'next/server';
// DO NOT import the middleware at the top level when using jest.doMock
// import { middleware as actualMiddleware } from '@/middleware';

// --- Mocks --- //

// Define the mock function signature clearly FIRST.
const mockAuthImplementation = jest.fn<Promise<NextResponse | undefined>, [NextReq]>();

// Use jest.doMock which is NOT hoisted.
// This ensures mockAuthImplementation is initialized before being used in the mock factory.
jest.doMock('@/lib/auth-edge', () => ({
  __esModule: true, // Required when mocking modules with default or named exports
  auth: mockAuthImplementation,
}));

// Mock the logger used within the middleware (keep as is)
jest.mock('@/lib/logger', () => ({
  loggers: {
    middleware: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Define an interface for the mocked NextRequest structure
interface MockNextRequest {
  nextUrl: URL;
  url: string;
  headers: Headers;
  cookies: { get: jest.Mock; has: jest.Mock };
  clone: jest.Mock;
}

// Mock NextResponse (keep as is, potentially simplify if full mock isn't needed)
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: URL | string) => {
      // Simulate a basic response object for testing headers/status
      const resp = new Response(null, { status: 307 });
      resp.headers.set('location', url.toString());
      return resp as unknown as NextResponse; // Cast for type compatibility
    }),
    next: jest.fn(() => {
      // Simulate a basic non-redirect response
      return new Response(null, { status: 200 }) as unknown as NextResponse;
    }),
  },
  NextRequest: jest.fn().mockImplementation(
    (urlStr: string): MockNextRequest => ({
      nextUrl: new URL(urlStr),
      url: urlStr,
      headers: new Headers(),
      cookies: {
        get: jest.fn(),
        has: jest.fn(),
      },
      // Add clone method if middleware uses it, explicitly typing 'this'
      clone: jest.fn().mockImplementation(function (this: MockNextRequest) {
        return { ...this };
      }),
    })
  ),
}));

describe('Middleware Logic', () => {
  let middleware: (req: NextReq) => Promise<NextResponse | undefined>;

  beforeAll(async () => {
    // Import the middleware *after* mocks are set up
    const middlewareModule = require('@/middleware');
    // Access the default export, which is the auth function itself
    middleware = middlewareModule.default as (req: NextReq) => Promise<NextResponse | undefined>;

    if (!middleware) {
      // Fallback if .default isn't used (e.g., different module system interaction)
      middleware = middlewareModule as (req: NextReq) => Promise<NextResponse | undefined>;
    }

    if (typeof middleware !== 'function') {
      throw new Error('Failed to correctly import the middleware function for testing.');
    }
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuthImplementation.mockReset();
    // Also reset mocks on NextResponse methods if they were called
    (NextResponse.redirect as jest.Mock).mockClear();
    (NextResponse.next as jest.Mock).mockClear();
    // Reset calls on the mock NextRequest constructor if needed
    (NextReq as jest.Mock).mockClear();
  });

  // --- Type Assertion for Test Scope ---
  // Moved inside beforeAll as the middleware is now imported dynamically

  it('should correctly encode redirect URLs when auth triggers a redirect', async () => {
    // --- Arrange ---
    const originalRequestUrl = 'http://localhost/dashboard?param=value with spaces&other=val';
    const loginUrl = new URL('/login', 'http://localhost');
    loginUrl.searchParams.set('callbackUrl', originalRequestUrl);

    // Create the expected redirect response using the *mocked* NextResponse
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Reset the mock call count just from creating the expected response
    (NextResponse.redirect as jest.Mock).mockClear();

    mockAuthImplementation.mockResolvedValue(redirectResponse);

    const req = new NextReq(originalRequestUrl);

    // --- Act ---
    const result = await middleware(req);

    // --- Assert ---
    if (!result) {
      fail('Expected a NextResponse, but received undefined');
    }

    // Check properties of the mocked response returned by auth
    expect(result).toBe(redirectResponse); // It should be the exact object returned by the mock
    expect(result.status).toBe(307); // From our mocked NextResponse.redirect
    const locationHeader = result.headers.get('location');
    expect(locationHeader).toBeDefined();
    // Adjust expectation for space encoding (+ instead of %20 in query params)
    const expectedEncodedCallbackUrl = encodeURIComponent(originalRequestUrl).replace(/%20/g, '+');
    expect(locationHeader).toBe(`http://localhost/login?callbackUrl=${expectedEncodedCallbackUrl}`);

    // Verify the auth mock was called
    expect(mockAuthImplementation).toHaveBeenCalledTimes(1);
    expect(mockAuthImplementation).toHaveBeenCalledWith(req);
    // The middleware returns the response from auth directly, so NextResponse.redirect is NOT called by it.
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should return undefined if auth passes and returns undefined', async () => {
    // --- Arrange ---
    mockAuthImplementation.mockResolvedValue(undefined);
    const originalRequestUrl = 'http://localhost/protected-route';
    const req = new NextReq(originalRequestUrl);

    // --- Act ---
    const result = await middleware(req);

    // --- Assert ---
    expect(result).toBeUndefined();
    expect(mockAuthImplementation).toHaveBeenCalledTimes(1);
    expect(mockAuthImplementation).toHaveBeenCalledWith(req);
    // Ensure redirect/next were not called
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it('should return NextResponse.next() if auth passes and returns that', async () => {
    // --- Arrange ---
    const nextResponse = NextResponse.next();
    // Reset the mock call count just from creating the expected response
    (NextResponse.next as jest.Mock).mockClear();

    mockAuthImplementation.mockResolvedValue(nextResponse);
    const originalRequestUrl = 'http://localhost/another-route';
    const req = new NextReq(originalRequestUrl);

    // --- Act ---
    const result = await middleware(req);

    // --- Assert ---
    if (!result) {
      fail('Expected a NextResponse, but received undefined');
    }
    // Check that the result IS the object returned by the auth mock
    expect(result).toBe(nextResponse);
    // We can still check basic properties from our mocked next()
    expect(result.status).toBe(200);
    expect(result.headers.get('location')).toBeNull();

    expect(mockAuthImplementation).toHaveBeenCalledTimes(1);
    expect(mockAuthImplementation).toHaveBeenCalledWith(req);
    // The middleware likely returns the auth result directly, so NextResponse.next is NOT called by it
    expect(NextResponse.next).not.toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});
