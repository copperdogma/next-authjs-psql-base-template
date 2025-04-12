import { AuthService, createAuthConfig } from '../../../../lib/auth';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../../../../lib/interfaces/services';
import { mockDeep } from 'jest-mock-extended';
import { PrismaAdapter } from '@auth/prisma-adapter';

// Mock dependencies
jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn().mockReturnValue({ name: 'MockPrismaAdapter' }),
}));

// Mock next-auth/providers/google
jest.mock('next-auth/providers/google', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue({ id: 'google', name: 'Google' }),
  };
});

// Mock Prisma
const prismaMock = mockDeep<PrismaClient>();

// Mock logger for verifying log calls
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockImplementation(() => loggerMock),
} as unknown as LoggerService;

// Setup environment variables needed by auth config
beforeAll(() => {
  // Mock environment variables
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret';
});

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  (loggerMock.info as jest.Mock).mockClear();
  (loggerMock.error as jest.Mock).mockClear();
  (loggerMock.warn as jest.Mock).mockClear();
  (loggerMock.debug as jest.Mock).mockClear();
});

describe('AuthService with Dependency Injection', () => {
  describe('constructor and dependency injection', () => {
    it('should create AuthService with injected dependencies', () => {
      const authService = new AuthService(loggerMock, prismaMock);

      // Calling createAuthConfig should use the injected dependencies
      const config = authService.createAuthConfig();

      expect(config).toBeDefined();
      expect(PrismaAdapter).toHaveBeenCalledWith(prismaMock);
    });

    it('should use default dependencies when not provided', () => {
      const authService = new AuthService();
      const config = authService.createAuthConfig();

      expect(config).toBeDefined();
      expect(PrismaAdapter).toHaveBeenCalled();
    });
  });

  describe('createAuthConfig', () => {
    it('should create valid NextAuth config with all required fields', () => {
      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      // Check that config has essential properties
      expect(config).toHaveProperty('adapter');
      expect(config).toHaveProperty('providers');
      expect(config).toHaveProperty('callbacks');
      expect(config).toHaveProperty('session');
      expect(config).toHaveProperty('events');
      expect(config).toHaveProperty('pages');

      // Check that callbacks are functions
      expect(typeof config.callbacks?.session).toBe('function');
      expect(typeof config.callbacks?.jwt).toBe('function');

      // Verify adapter was created with the prisma mock
      expect(PrismaAdapter).toHaveBeenCalledWith(prismaMock);
    });

    it('should set URL dynamically when NEXTAUTH_URL contains environment variable placeholder', () => {
      const originalNextAuthUrl = process.env.NEXTAUTH_URL;
      process.env.NEXTAUTH_URL = '${VERCEL_URL}';

      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      expect(config).toHaveProperty('url');

      // Restore original value
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    });
  });

  describe('jwt callback', () => {
    it('should update token with user data on sign-in', async () => {
      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      // Mock user data
      const user = { id: 'user-123', name: 'Test User', email: 'test@example.com' };
      const token = { sub: null };

      // Call JWT callback with user data
      const result = await config.callbacks?.jwt?.({
        token,
        user,
        trigger: 'signIn',
      } as any);

      // Verify token was updated with user data
      expect(result).toMatchObject({
        name: user.name,
        email: user.email,
      });

      // Verify logging occurred
      expect(loggerMock.info).toHaveBeenCalledWith({
        msg: 'User signed in',
        userId: user.id,
      });
    });

    it('should refresh token data from database on update trigger', async () => {
      // Setup Prisma mock to return user data
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-456',
        name: 'Updated User',
        email: 'updated@example.com',
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      const token = { sub: 'user-456' };

      // Call JWT callback with update trigger
      const result = await config.callbacks?.jwt?.({
        token,
        trigger: 'update',
      } as any);

      // Verify token was updated with database data
      expect(result?.name).toBe('Updated User');
      expect(result?.email).toBe('updated@example.com');

      // Verify Prisma was called correctly
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-456' },
        select: { name: true, email: true },
      });
    });

    it('should handle database errors during token refresh', async () => {
      // Setup Prisma mock to throw error
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      const token = { sub: 'user-789', name: 'Original Name' };

      // Call JWT callback with update trigger
      const result = await config.callbacks?.jwt?.({
        token,
        trigger: 'update',
      } as any);

      // Token should remain unchanged
      expect(result).toEqual(token);

      // Verify error was logged
      expect(loggerMock.error).toHaveBeenCalledWith({
        msg: 'Failed to refresh token from database',
        userId: 'user-789',
        error: expect.any(Error),
      });
    });
  });

  describe('session callback', () => {
    it('should add user ID from token to session', async () => {
      const authService = new AuthService(loggerMock, prismaMock);
      const config = authService.createAuthConfig();

      const token = { sub: 'user-123', name: 'Test User', email: 'test@example.com' };
      const session = { user: {} };

      // Verify session callback exists
      expect(config.callbacks?.session).toBeDefined();

      // Call session callback with type assertion
      const sessionCallback = config.callbacks?.session;
      const result = await sessionCallback?.({ session, token } as any);

      // Type assertion for test expectations
      expect(result).toBeDefined();
      const typedResult = result as { user: { id?: string; name?: string; email?: string } };

      // Verify user ID was added to session
      expect(typedResult.user.id).toBe('user-123');
      expect(typedResult.user.name).toBe('Test User');
      expect(typedResult.user.email).toBe('test@example.com');

      // Verify logging occurred
      expect(loggerMock.debug).toHaveBeenCalledWith({
        msg: 'Session callback executed',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  describe('utility methods', () => {
    it('should create correlation ID with prefix', () => {
      const authService = new AuthService(loggerMock);
      const correlationId = authService.createCorrelationId('test');

      expect(correlationId).toMatch(/^test_[a-z0-9]{8}$/);
    });

    it('should extract client info from options', () => {
      const authService = new AuthService(loggerMock);

      // Browser context - mock window
      const windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(
        () =>
          ({
            navigator: {
              userAgent: 'test-user-agent',
            },
          }) as any
      );

      const options = { callbackUrl: '/dashboard' };
      const clientInfo = authService.extractClientInfo(options, false);

      expect(clientInfo.source).toBe('/dashboard');
      expect(clientInfo.userAgent).toBe('test-user-agent');
      expect(clientInfo.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Server context
      const serverClientInfo = authService.extractClientInfo(options, true);
      expect(serverClientInfo.userAgent).toBe('server');

      // Cleanup
      windowSpy.mockRestore();
    });

    it('should log sign-in success', () => {
      const authService = new AuthService(loggerMock);
      const params = {
        provider: 'google',
        correlationId: 'test_12345678',
        startTime: Date.now() - 100,
      };

      authService.logSignInSuccess(params);

      expect(loggerMock.info).toHaveBeenCalledWith({
        msg: 'Sign-in attempt completed',
        provider: 'google',
        success: true,
        correlationId: 'test_12345678',
        duration: expect.any(Number),
      });
    });

    it('should log sign-in failure', () => {
      const authService = new AuthService(loggerMock);
      const params = {
        provider: 'google',
        error: 'Invalid credentials',
        correlationId: 'test_12345678',
        startTime: Date.now() - 100,
      };

      authService.logSignInFailure(params);

      expect(loggerMock.warn).toHaveBeenCalledWith({
        msg: 'Sign-in attempt failed',
        provider: 'google',
        error: 'Invalid credentials',
        correlationId: 'test_12345678',
        duration: expect.any(Number),
      });
    });

    it('should log sign-in error with proper error object formatting', () => {
      const authService = new AuthService(loggerMock);
      const error = new Error('Authentication failed');
      error.stack = 'Error: Authentication failed\n    at Test.js:1:1';

      const params = {
        provider: 'google',
        error,
        correlationId: 'test_12345678',
        startTime: Date.now() - 100,
      };

      authService.logSignInError(params);

      expect(loggerMock.error).toHaveBeenCalledWith({
        msg: 'Sign-in attempt threw exception',
        provider: 'google',
        error: {
          name: 'Error',
          message: 'Authentication failed',
          stack: error.stack,
        },
        correlationId: 'test_12345678',
        duration: expect.any(Number),
      });
    });
  });

  describe('createAuthConfig function (legacy support)', () => {
    it('should create config using AuthService with injected dependencies', () => {
      const config = createAuthConfig(prismaMock, loggerMock);

      expect(config).toBeDefined();
      expect(PrismaAdapter).toHaveBeenCalledWith(prismaMock);

      // Indirectly verify that loggerMock was used by triggering an event that logs
      if (config.events?.signIn) {
        config.events.signIn({ user: { id: 'test-id', email: 'test@example.com' } } as any);

        expect(loggerMock.info).toHaveBeenCalledWith({
          msg: 'User authenticated successfully',
          userId: 'test-id',
          email: 'test@example.com',
        });
      }
    });
  });
});
