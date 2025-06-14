/**
 * @jest-environment node
 */
// Import the module to be tested
// import { authConfigEdge } from '@/lib/auth-edge'; // Will be imported dynamically in tests
import { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server'; // NextResponse itself is not directly used in tests, only its mock
import type { Session, User as NextAuthUser } from 'next-auth'; // Import Session type
import type { JWT } from 'next-auth/jwt';
import { UserRole } from '@/types'; // Import UserRole if not automatically available
import { jest } from '@jest/globals';

// Top-level variable for captured redirect arguments
let receivedRedirectArgs: any[] | undefined;

// Mock logger to prevent console output during tests and allow assertions
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};
jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock the logger used by auth-edge and its dependencies
/* // Removed unused variable
const mockLoggerInstance = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(),
};
*/
// Note: We rely on the global mock in jest.setup.api.mocks.ts for @/lib/logger
// But we explicitly mock the request logger middleware here to ensure its dependencies
// (like createLogger at the module level) don't cause issues during auth-edge tests.
jest.mock('@/middleware/request-logger', () => ({
  __esModule: true,
  logRequestResponse: jest.fn(), // Provide a simple mock function
}));

const mockAuthSession = (
  user?: Partial<NextAuthUser & { id: string; role: UserRole }>,
  expires?: string
): Session => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    role: UserRole.USER, // Default role
    ...user,
  } as NextAuthUser & { id: string; role: UserRole },
  expires: expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to 24 hours from now
});

// Mock Response instance to be returned by the redirect spy
const mockResponseInstance = {
  status: 307,
  headers: new Headers(),
  redirected: true,
  ok: false,
  type: 'default',
} as unknown as Response; // A more Response-like object

// This will be the implementation for the spy
const mockRedirectImplementation = (...args: any[]): Response => {
  receivedRedirectArgs = args; // Store arguments
  return mockResponseInstance; // Return a mock Response instance
};

describe('authConfigEdge', () => {
  const originalEnv = { ...process.env };
  // Simplify the type for replaceProperty or rely on inference
  let replaceProperty: (obj: any, key: any, value: any) => any;
  // let receivedRedirectArgs: any[] | undefined; // Moved to top level

  beforeAll(() => {
    // Dynamically import jest.replaceProperty for environments that support it
    try {
      const jestExtended = require('jest-extended');
      if (jestExtended && typeof jestExtended.replaceProperty === 'function') {
        replaceProperty = jestExtended.replaceProperty;
      }
    } catch (e) {
      // jest-extended not available, or replaceProperty not found
      replaceProperty = (obj, key, value) => {
        const originalValue = obj[key];
        obj[key] = value;
        return {
          restore: () => {
            obj[key] = originalValue;
          },
        };
      };
    }
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear mocks before each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    // receivedRedirectArgs is reset in the inner describe block's beforeEach
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('NEXTAUTH_SECRET Handling', () => {
    it('should throw an error if NEXTAUTH_SECRET is not set in production', async () => {
      if (replaceProperty) {
        const restoreNodeEnv = replaceProperty(process.env, 'NODE_ENV', 'production');
        delete process.env.NEXTAUTH_SECRET;
        await expect(import('@/lib/auth-edge')).rejects.toThrow(
          'NEXTAUTH_SECRET is not set. Please set it in your .env file (or environment variables).'
        );
        restoreNodeEnv.restore();
      } else {
        console.warn('Skipping NEXTAUTH_SECRET production test due to missing replaceProperty');
      }
    });

    it('should not throw if NEXTAUTH_SECRET is set in production', async () => {
      if (replaceProperty) {
        const restoreNodeEnv = replaceProperty(process.env, 'NODE_ENV', 'production');
        process.env.NEXTAUTH_SECRET = 'test-secret';
        await expect(import('@/lib/auth-edge')).resolves.toBeDefined();
        restoreNodeEnv.restore();
      } else {
        console.warn('Skipping NEXTAUTH_SECRET production test due to missing replaceProperty');
      }
    });

    it('should not throw if NEXTAUTH_SECRET is not set in non-production', async () => {
      if (replaceProperty) {
        const restoreNodeEnv = replaceProperty(process.env, 'NODE_ENV', 'development');
        delete process.env.NEXTAUTH_SECRET;
        await expect(import('@/lib/auth-edge')).resolves.toBeDefined();
        restoreNodeEnv.restore();
      } else {
        console.warn('Skipping NEXTAUTH_SECRET non-production test due to missing replaceProperty');
      }
    });
  });

  describe('callbacks structure', () => {
    it('should have session and jwt callbacks defined', async () => {
      process.env.NEXTAUTH_SECRET = 'test-secret'; // Ensure it's set for import
      const { authConfigEdge } = await import('@/lib/auth-edge');
      expect(authConfigEdge.callbacks).toBeDefined();
      expect(authConfigEdge.callbacks?.session).toBeInstanceOf(Function);
      expect(authConfigEdge.callbacks?.jwt).toBeInstanceOf(Function);
      expect(authConfigEdge.callbacks?.authorized).toBeInstanceOf(Function);
    });
  });

  describe('session callback', () => {
    let sessionCallback: any;
    beforeEach(async () => {
      process.env.NEXTAUTH_SECRET = 'test-secret';
      const { authConfigEdge } = await import('@/lib/auth-edge');
      sessionCallback = authConfigEdge.callbacks?.session;
    });

    it('should return session with user id and role from token', async () => {
      const mockSession = mockAuthSession({ id: 'token-user-id', role: UserRole.ADMIN });
      const mockToken: JWT = {
        sub: 'token-user-id',
        id: 'token-user-id',
        role: UserRole.ADMIN,
        name: 'Token User',
        email: 'token@example.com',
      };
      const result = await sessionCallback({ session: mockSession, token: mockToken });
      expect(result.user.id).toBe('token-user-id');
      expect(result.user.role).toBe(UserRole.ADMIN);
    });

    it('should return session with token id when token has id but no sub', async () => {
      const mockSession = mockAuthSession({ id: 'session-user-id', role: UserRole.USER });
      const mockToken: JWT = {
        name: 'Token User',
        email: 'token@example.com',
        id: 'no-id',
        role: UserRole.USER,
      }; // No sub or role
      const result = await sessionCallback({ session: mockSession, token: mockToken });
      expect(result.user.id).toBe('no-id'); // Should use token.id
      expect(result.user.role).toBe(UserRole.USER);
    });
  });

  describe('jwt callback', () => {
    let jwtCallback: any;
    beforeEach(async () => {
      process.env.NEXTAUTH_SECRET = 'test-secret';
      const { authConfigEdge } = await import('@/lib/auth-edge');
      jwtCallback = authConfigEdge.callbacks?.jwt;
    });

    it('should add user role and id to token if user object exists (e.g. on sign in)', async () => {
      const mockUser = { id: 'new-user-id', role: UserRole.USER } as NextAuthUser & {
        id: string;
        role: UserRole;
      };
      const mockToken: JWT = { id: '', role: UserRole.USER }; // Minimal token
      const resultToken = await jwtCallback({ token: mockToken, user: mockUser });
      expect(resultToken.role).toBe(UserRole.USER);
      expect(resultToken.id).toBe('new-user-id'); // 'id' should be populated with user.id
    });

    it('should return original token if no user object (e.g. session update)', async () => {
      const mockToken: JWT = { id: 'existing-user-id', role: UserRole.USER };
      const resultToken = await jwtCallback({ token: mockToken });
      expect(resultToken.id).toBe('existing-user-id');
      expect(resultToken.role).toBe(UserRole.USER);
    });
  });

  describe('jwt callback - user population', () => {
    let jwtCallback: any;
    beforeEach(async () => {
      process.env.NEXTAUTH_SECRET = 'test-secret';
      const { authConfigEdge } = await import('@/lib/auth-edge');
      jwtCallback = authConfigEdge.callbacks?.jwt;
    });

    it('should populate token from user object with all fields', async () => {
      const mockUser = {
        id: 'user-id-123',
        role: UserRole.ADMIN,
        name: 'Test User Name',
        email: 'testuser@example.com',
        image: 'test-image.jpg',
      } as NextAuthUser & { id: string; role: UserRole };
      const mockToken: JWT = { id: '', role: UserRole.USER }; // Minimal token
      const resultToken = await jwtCallback({ token: mockToken, user: mockUser });

      expect(resultToken.id).toBe('user-id-123');
      expect(resultToken.role).toBe(UserRole.ADMIN);
      expect(resultToken.name).toBe('Test User Name');
      expect(resultToken.email).toBe('testuser@example.com');
      expect(resultToken.picture).toBe('test-image.jpg');
    });

    it('should handle session update trigger correctly', async () => {
      const mockToken: JWT = { id: 'existing-user-id', role: UserRole.USER, name: 'Old Name' };
      const mockSession = { user: { name: 'New Name' } } as Session;
      const resultToken = await jwtCallback({
        token: mockToken,
        trigger: 'update',
        session: mockSession,
      });
      expect(resultToken.name).toBe('New Name');
    });
  });

  describe('initNextAuth - already initialized', () => {
    it('should return existing instance if NextAuth already initialized', async () => {
      process.env.NEXTAUTH_SECRET = 'test-secret'; // Ensure it's set for import

      // First import to initialize
      const { auth: authInstance1, signIn: signInInstance1 } = await import('@/lib/auth-edge');
      expect(authInstance1).toBeDefined();
      expect(signInInstance1).toBeDefined();

      // Spy on logger.debug before second import
      const debugSpy = jest.spyOn(mockLogger, 'debug');

      // Reset modules to ensure re-import executes init logic again if not truly singleton
      jest.resetModules();
      // Re-set the secret as resetModules will clear it from process.env if set by the module itself
      process.env.NEXTAUTH_SECRET = 'test-secret';

      // Second import should use existing instance due to global symbol check
      const { auth: authInstance2, signIn: signInInstance2 } = await import('@/lib/auth-edge');

      expect(authInstance2).toBeDefined(); // Check it's defined
      expect(signInInstance2).toBeDefined(); // Check it's defined
      // With jest.resetModules(), the instances will be different if not truly a singleton across module reloads.
      // The critical part is that the logger message for "already initialized" should be hit.
      expect(debugSpy).toHaveBeenCalledWith(
        '[Auth Edge Config] NextAuth already initialized at module level'
      );
      debugSpy.mockRestore();
    });
  });

  describe('authorized callback', () => {
    let authorizedCallback: any;
    let redirectSpy: any;

    beforeEach(async () => {
      receivedRedirectArgs = undefined; // Reset before each test

      // Spy on global.Response.redirect and use our implementation
      redirectSpy = jest
        .spyOn(global.Response, 'redirect')
        .mockImplementation(mockRedirectImplementation);

      process.env.NEXTAUTH_SECRET = 'test-secret'; // Ensure it's set for import
      const { authConfigEdge } = await import('@/lib/auth-edge');
      authorizedCallback = authConfigEdge.callbacks?.authorized;
      if (!authorizedCallback) {
        throw new Error('authorized callback not found in authConfigEdge');
      }
    });

    afterEach(() => {
      redirectSpy.mockRestore(); // Restore the original implementation after each test
    });

    const mockRequestBase = (pathname: string, origin: string = 'http://localhost:3000') => {
      const urlString = new URL(pathname, origin).toString();
      return {
        url: urlString, // Add the url string property
        nextUrl: new URL(pathname, origin),
        headers: new Headers({
          'X-Correlation-ID': 'test-correlation-id',
          'x-forwarded-for': '123.123.123.123',
        }),
      } as unknown as NextRequest;
    };

    it('should allow unauthenticated access to public routes', async () => {
      const request = mockRequestBase('/');
      const result = await authorizedCallback({ auth: null, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should allow authenticated access to public routes', async () => {
      const request = mockRequestBase('/about');
      const auth = mockAuthSession();
      const result = await authorizedCallback({ auth, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated access to API health route', async () => {
      const request = mockRequestBase('/api/health');
      const result = await authorizedCallback({ auth: null, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated access to auth routes (/login)', async () => {
      const request = mockRequestBase('/login');
      const result = await authorizedCallback({ auth: null, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should allow authenticated access to non-auth, non-public routes (e.g. /dashboard)', async () => {
      const request = mockRequestBase('/dashboard');
      const auth = mockAuthSession();
      let result = await authorizedCallback({ auth, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should allow access to /api/auth routes (handled by NextAuth internally)', async () => {
      const request = mockRequestBase('/api/auth/signin');
      const result = await authorizedCallback({ auth: null, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('should redirect authenticated access to an auth route (/login) to dashboard', async () => {
      const request = mockRequestBase('/login');
      const auth = mockAuthSession();
      const result = await authorizedCallback({ auth, request });
      expect(redirectSpy).toHaveBeenCalledTimes(1); // Check the spy
      expect(receivedRedirectArgs).toBeDefined();
      expect(receivedRedirectArgs?.[0]).toEqual(new URL('/dashboard', 'http://localhost:3000'));
      expect(result).toBe(mockResponseInstance);
    });

    it('should redirect unauthenticated access to a protected route (/dashboard) to login with callbackUrl', async () => {
      const request = mockRequestBase('/dashboard');
      const result = await authorizedCallback({ auth: null, request });
      expect(redirectSpy).toHaveBeenCalledTimes(1); // Check the spy
      const expectedRedirectUrl = new URL(
        '/login?callbackUrl=%2Fdashboard',
        'http://localhost:3000'
      );
      expect(receivedRedirectArgs).toBeDefined();
      expect(receivedRedirectArgs?.[0]).toEqual(expectedRedirectUrl);
      expect(result).toBe(mockResponseInstance);
    });

    it('should allow access for icon files like /favicon.ico', async () => {
      const request = mockRequestBase('/favicon.ico');
      const auth = mockAuthSession(); // or null, should not matter
      const result = await authorizedCallback({ auth, request });
      expect(result).toBe(true);
      expect(redirectSpy).not.toHaveBeenCalled();
    });
  });
});
