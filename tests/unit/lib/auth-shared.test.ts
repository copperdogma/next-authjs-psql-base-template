import { jest } from '@jest/globals';
// import { DefaultSession, Session } from 'next-auth'; // DefaultSession unused
import { Session } from 'next-auth';
import { JWT } from '@auth/core/jwt';
import { UserRole } from '@/types';

// Mock the logger used in the callback
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

// Dynamically import the module to test after setting env variables
const importAuthShared = async () => {
  return (await import('@/lib/auth-shared')) as typeof import('@/lib/auth-shared');
};

describe('lib/auth-shared', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear module cache before each test
    process.env = { ...OLD_ENV }; // Make a copy
    jest.clearAllMocks(); // Clear mocks
  });

  describe('handleSharedSessionCallback', () => {
    it('should correctly map token properties to session user', async () => {
      const { handleSharedSessionCallback } = await importAuthShared();
      const mockSession: Session = {
        user: {
          name: 'Initial Name',
          email: 'initial@test.com',
          role: UserRole.USER,
          id: 'temp-id',
        },
        expires: '1',
      };
      const mockToken: JWT = {
        id: 'user-123',
        role: UserRole.ADMIN,
        name: 'Token Name',
        email: 'token@test.com',
        picture: 'token-image.png',
        iat: 123,
        exp: 456,
        jti: 'abc',
      };

      const updatedSession = await handleSharedSessionCallback({
        session: mockSession as Session,
        token: mockToken,
      });

      expect(updatedSession.user.id).toBe(mockToken.id);
      expect(updatedSession.user.role).toBe(mockToken.role);
      expect(updatedSession.user.name).toBe(mockToken.name);
      expect(updatedSession.user.email).toBe(mockToken.email);
      expect(updatedSession.user.image).toBe(mockToken.picture);
      expect(updatedSession.expires).toBe(mockSession.expires); // Should not change expires
    });

    it('should handle tokens with missing optional properties', async () => {
      const { handleSharedSessionCallback } = await importAuthShared();
      const mockSession: Session = {
        user: {
          name: 'Initial Name',
          email: 'initial@test.com',
          image: 'initial.png',
          id: 'temp-id-2',
          role: UserRole.USER,
        },
        expires: '1',
      };
      const mockToken: JWT = {
        id: 'user-456',
        role: UserRole.USER,
        // Missing name, email, picture
      };

      const updatedSession = await handleSharedSessionCallback({
        session: mockSession as Session,
        token: mockToken,
      });

      expect(updatedSession.user.id).toBe(mockToken.id);
      expect(updatedSession.user.role).toBe(mockToken.role);
      // Should retain initial session values if not in token
      expect(updatedSession.user.name).toBe(mockSession.user?.name);
      expect(updatedSession.user.email).toBe(mockSession.user?.email);
      expect(updatedSession.user.image).toBe(mockSession.user?.image);
    });

    it('should handle null token gracefully', async () => {
      const { handleSharedSessionCallback } = await importAuthShared();
      const mockSession: Session = {
        user: {
          name: 'Initial Name',
          email: 'initial@test.com',
          id: 'temp-id-3',
          role: UserRole.USER,
        },
        expires: '1',
      };

      // Pass null instead of a JWT object
      const updatedSession = await handleSharedSessionCallback({
        session: mockSession as Session,
        token: null as any,
      });

      // User object should remain unchanged
      expect(updatedSession.user).toEqual(mockSession.user);
      expect(updatedSession.user.id).toBe('temp-id-3'); // Check against the initial ID
      expect(updatedSession.user.role).toBe(UserRole.USER); // Check against the initial role
    });
  });

  describe('sharedAuthConfig', () => {
    it('should use secure cookie prefix and secure flag in production', async () => {
      jest.replaceProperty(process, 'env', { ...OLD_ENV, NODE_ENV: 'production' });
      const { sharedAuthConfig } = await importAuthShared();

      expect(sharedAuthConfig.cookies?.sessionToken?.name).toBe('__Secure-next-auth.session-token');
      expect(sharedAuthConfig.cookies?.sessionToken?.options?.secure).toBe(true);
    });

    it('should use standard cookie prefix and no secure flag in development', async () => {
      jest.replaceProperty(process, 'env', { ...OLD_ENV, NODE_ENV: 'development' });
      const { sharedAuthConfig } = await importAuthShared();

      expect(sharedAuthConfig.cookies?.sessionToken?.name).toBe('next-auth.session-token');
      expect(sharedAuthConfig.cookies?.sessionToken?.options?.secure).toBe(false);
    });

    it('should default to development settings if NODE_ENV is not set', async () => {
      const currentEnv = { ...OLD_ENV };
      // @ts-expect-error - Allow deleting potentially non-optional property from our copy for testing purposes
      delete currentEnv.NODE_ENV; // Delete NODE_ENV from the copy
      // Use jest.replaceProperty to mock NODE_ENV
      jest.replaceProperty(process, 'env', currentEnv);
      const { sharedAuthConfig } = await importAuthShared();

      expect(sharedAuthConfig.cookies?.sessionToken?.name).toBe('next-auth.session-token');
      expect(sharedAuthConfig.cookies?.sessionToken?.options?.secure).toBe(false);
    });

    it('should set common session strategy', async () => {
      const { sharedAuthConfig } = await importAuthShared();
      expect(sharedAuthConfig.session?.strategy).toBe('jwt');
    });

    it('should assign the session callback', async () => {
      const { sharedAuthConfig, handleSharedSessionCallback } = await importAuthShared();
      expect(sharedAuthConfig.callbacks?.session).toBe(handleSharedSessionCallback);
    });

    it('should define pages', async () => {
      const { sharedAuthConfig } = await importAuthShared();
      expect(sharedAuthConfig.pages?.signIn).toBe('/login');
      expect(sharedAuthConfig.pages?.error).toBe('/auth/error');
    });
  });
});
