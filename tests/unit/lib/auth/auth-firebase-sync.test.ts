import { mock } from 'jest-mock-extended';
import { shouldSyncFirebaseUser, syncFirebaseUserForOAuth } from '@/lib/auth/auth-firebase-sync';
import { logger } from '@/lib/logger';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminAuth: jest.fn(),
}));

describe('Firebase Auth Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldSyncFirebaseUser', () => {
    it('should return true for OAuth provider on sign-in', () => {
      expect(shouldSyncFirebaseUser('signIn', 'oauth')).toBe(true);
    });

    it('should return true for OIDC provider on sign-up', () => {
      expect(shouldSyncFirebaseUser('signUp', 'oidc')).toBe(true);
    });

    it('should return false for credentials provider', () => {
      expect(shouldSyncFirebaseUser('signIn', 'credentials')).toBe(false);
    });

    it('should return false for undefined trigger', () => {
      expect(shouldSyncFirebaseUser(undefined, 'oauth')).toBe(false);
    });

    it('should return false for undefined account type', () => {
      expect(shouldSyncFirebaseUser('signIn', undefined)).toBe(false);
    });
  });

  describe('syncFirebaseUserForOAuth', () => {
    const mockCorrelationId = 'test-correlation-id';
    const mockBaseLogContext = { trigger: 'signIn', correlationId: mockCorrelationId };

    it('should skip sync and log at debug level for credentials provider', async () => {
      const mockUser = { id: 'user-123', name: 'Test User', email: 'test@example.com' };
      const mockAccount = { provider: 'credentials', type: 'credentials' };

      await syncFirebaseUserForOAuth(
        {
          trigger: 'signIn',
          account: mockAccount as any,
          user: mockUser as any,
          profile: undefined,
        },
        mockBaseLogContext
      );

      // Should log at debug level for credentials
      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: mockCorrelationId,
          provider: 'credentials',
          accountType: 'credentials',
        }),
        expect.stringContaining('Skipping Firebase OAuth Sync')
      );

      // Should not log at warn level
      expect(logger.warn).not.toHaveBeenCalled();

      // Should not attempt to get Firebase auth
      expect(getFirebaseAdminAuth).not.toHaveBeenCalled();
    });

    it('should log a warning if user ID is missing', async () => {
      const mockUser = { name: 'Test User', email: 'test@example.com' };
      const mockAccount = { provider: 'google', type: 'oauth' };

      await syncFirebaseUserForOAuth(
        {
          trigger: 'signIn',
          account: mockAccount as any,
          user: mockUser as any,
          profile: undefined,
        },
        mockBaseLogContext
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: mockCorrelationId,
          user: mockUser,
        }),
        expect.stringContaining('User ID is missing or user object is invalid')
      );

      // Should not attempt to get Firebase auth
      expect(getFirebaseAdminAuth).not.toHaveBeenCalled();
    });

    it('should log info for OAuth provider and proceed with sync', async () => {
      const mockUser = { id: 'user-123', name: 'Test User', email: 'test@example.com' };
      const mockAccount = { provider: 'google', type: 'oauth' };
      const mockFirebaseAuth = {
        getUser: jest.fn().mockResolvedValue({ uid: 'user-123', email: 'test@example.com' }),
      };

      (getFirebaseAdminAuth as jest.Mock).mockReturnValue(mockFirebaseAuth);

      await syncFirebaseUserForOAuth(
        {
          trigger: 'signIn',
          account: mockAccount as any,
          user: mockUser as any,
          profile: { email: 'test@example.com', email_verified: true, name: 'Test User' },
        },
        mockBaseLogContext
      );

      // Should log at info level for OAuth
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: mockCorrelationId,
          userId: 'user-123',
          provider: 'google',
        }),
        expect.stringContaining('Conditions met for Firebase OAuth Sync')
      );

      // Should attempt to get Firebase auth
      expect(getFirebaseAdminAuth).toHaveBeenCalled();

      // Should check if user exists
      expect(mockFirebaseAuth.getUser).toHaveBeenCalledWith('user-123');
    });
  });
});
