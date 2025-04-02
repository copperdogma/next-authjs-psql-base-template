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
import { authConfig } from '../../../lib/auth';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';
import { Account, Profile } from 'next-auth';

describe('Auth Config', () => {
  const { loggers } = require('../../../lib/logger');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callbacks', () => {
    describe('session callback', () => {
      it('should add user ID to session and log debug message', async () => {
        const mockUser: AdapterUser = {
          id: 'user123',
          email: 'test@example.com',
          emailVerified: null,
        };
        const mockSession = {
          user: {
            email: 'test@example.com',
          },
        } as Session;
        const mockToken = {
          sub: 'user123',
        } as JWT;

        const result = await authConfig.callbacks!.session!({
          session: mockSession,
          token: mockToken,
          user: mockUser,
          newSession: mockSession,
          trigger: 'update',
        });

        expect((result.user as any).id).toBe('user123');
        expect(loggers.auth.debug).toHaveBeenCalledWith({
          msg: 'Session callback executed',
          userId: 'user123',
          email: 'test@example.com',
        });
      });

      it('should return session unchanged if no token.sub', async () => {
        const mockUser: AdapterUser = {
          id: 'user123',
          email: 'test@example.com',
          emailVerified: null,
        };
        const mockSession = {
          user: {
            email: 'test@example.com',
          },
        } as Session;
        const mockToken = {} as JWT;

        const result = await authConfig.callbacks!.session!({
          session: mockSession,
          token: mockToken,
          user: mockUser,
          newSession: mockSession,
          trigger: 'update',
        });

        expect(result).toBe(mockSession);
        expect(loggers.auth.debug).not.toHaveBeenCalled();
      });
    });

    describe('jwt callback', () => {
      it('should add user ID to token and log info message', async () => {
        const mockToken = {} as JWT;
        const mockUser: AdapterUser = {
          id: 'user123',
          email: 'test@example.com',
          emailVerified: null,
        };
        const mockAccount: Account = {
          type: 'oauth',
          provider: 'google',
          providerAccountId: '123',
          access_token: 'token',
          token_type: 'Bearer',
        };

        const result = await authConfig.callbacks!.jwt!({
          token: mockToken,
          user: mockUser,
          account: mockAccount,
          profile: { sub: 'user123', email: 'test@example.com' } as Profile,
          trigger: 'signIn',
        });

        expect((result as any).id).toBe('user123');
        expect(loggers.auth.info).toHaveBeenCalledWith({
          msg: 'User signed in',
          userId: 'user123',
        });
      });

      it('should return token unchanged if no user', async () => {
        const mockToken = { sub: 'existing123' } as JWT;

        const result = await authConfig.callbacks!.jwt!({
          token: mockToken,
          user: null as any,
          account: null,
          trigger: 'update',
        });

        expect(result).toBe(mockToken);
        expect(loggers.auth.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('events', () => {
    it('should log signIn event', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      authConfig.events!.signIn!({ user: mockUser } as any);

      expect(loggers.auth.info).toHaveBeenCalledWith({
        msg: 'User authenticated successfully',
        userId: 'user123',
        email: 'test@example.com',
      });
    });

    it('should log signOut event', () => {
      const mockToken = {
        sub: 'user123',
      };

      authConfig.events!.signOut!({ token: mockToken } as any);

      expect(loggers.auth.info).toHaveBeenCalledWith({
        msg: 'User signed out',
        userId: 'user123',
      });
    });

    it('should log createUser event', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      authConfig.events!.createUser!({ user: mockUser } as any);

      expect(loggers.auth.info).toHaveBeenCalledWith({
        msg: 'New user created',
        userId: 'user123',
        email: 'test@example.com',
      });
    });

    it('should log linkAccount event', () => {
      const mockUser = {
        id: 'user123',
      };
      const mockAccount = {
        provider: 'google',
      };

      authConfig.events!.linkAccount!({ user: mockUser, account: mockAccount } as any);

      expect(loggers.auth.info).toHaveBeenCalledWith({
        msg: 'Account linked to user',
        userId: 'user123',
        provider: 'google',
      });
    });

    it('should log session event', () => {
      const mockToken = {
        sub: 'user123',
      };

      authConfig.events!.session!({ token: mockToken } as any);

      expect(loggers.auth.debug).toHaveBeenCalledWith({
        msg: 'Session updated',
        userId: 'user123',
      });
    });

    it('should not log session event if no token.sub', () => {
      const mockToken = {};

      authConfig.events!.session!({ token: mockToken } as any);

      expect(loggers.auth.debug).not.toHaveBeenCalled();
    });
  });
});
