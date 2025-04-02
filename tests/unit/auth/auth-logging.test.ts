/**
 * @jest-environment jsdom
 */

// Mock next-auth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Mock @auth/prisma-adapter
jest.mock('@auth/prisma-adapter', () => ({
  __esModule: true,
  PrismaAdapter: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve({ ok: true })),
  signOut: jest.fn(() => Promise.resolve({ ok: true })),
}));

// Mock logger module
jest.mock('../../../lib/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    loggers: {
      auth: mockLogger,
    },
  };
});

// Import after mocks
import { signInWithLogging, signOutWithLogging } from '../../../lib/auth';

describe('Auth Logging', () => {
  const { loggers } = require('../../../lib/logger');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock jsdom's user agent
    global.window = {
      navigator: {
        userAgent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3',
      },
    } as any;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('signInWithLogging', () => {
    it('should log successful sign-in with provider and client info', async () => {
      // Call the function we're testing
      await signInWithLogging('google', { callbackUrl: '/dashboard' });

      // Verify logs were called with expected data
      expect(loggers.auth.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Sign-in attempt initiated',
          provider: 'google',
          clientInfo: expect.objectContaining({
            source: '/dashboard',
            userAgent: expect.any(String),
            timestamp: expect.any(String),
          }),
          correlationId: expect.stringMatching(/^auth_[a-z0-9]{8}$/),
        })
      );

      expect(loggers.auth.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Sign-in attempt completed',
          provider: 'google',
          success: true,
          correlationId: expect.stringMatching(/^auth_[a-z0-9]{8}$/),
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('signOutWithLogging', () => {
    it('should log successful sign-out with client info', async () => {
      // Call the function we're testing
      await signOutWithLogging({ callbackUrl: '/login' });

      // Verify logs were called with expected data
      expect(loggers.auth.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Sign-out initiated',
          clientInfo: expect.objectContaining({
            callbackUrl: '/login',
            userAgent: expect.any(String),
            timestamp: expect.any(String),
          }),
          correlationId: expect.stringMatching(/^signout_[a-z0-9]{8}$/),
        })
      );

      expect(loggers.auth.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Sign-out completed',
          success: true,
          correlationId: expect.stringMatching(/^signout_[a-z0-9]{8}$/),
          duration: expect.any(Number),
        })
      );
    });

    it('should use default callback URL if not provided', async () => {
      // Call without options
      await signOutWithLogging();

      // Verify client info uses default
      expect(loggers.auth.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Sign-out initiated',
          clientInfo: expect.objectContaining({
            callbackUrl: 'default',
            userAgent: expect.any(String),
            timestamp: expect.any(String),
          }),
          correlationId: expect.stringMatching(/^signout_[a-z0-9]{8}$/),
        })
      );
    });
  });
});
