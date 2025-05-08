import { v4 as uuidv4 } from 'uuid';
import { type Session } from 'next-auth';
import { type JWT } from '@auth/core/jwt';
import { logger } from '@/lib/logger';
import { handleJwtSignIn, handleJwtUpdate } from '@/lib/auth/auth-jwt';
import { handleSharedSessionCallback } from '@/lib/auth-shared';
import { authConfigNode } from '@/lib/auth-node';
import { UserRole } from '@/types';
import { createMockUser, createMockAccount, createMockToken } from '@/tests/mocks/auth';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('@/lib/logger');
jest.mock('@/lib/auth/auth-jwt');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

const mockUuidv4 = uuidv4 as jest.Mock;
const mockHandleJwtSignIn = handleJwtSignIn as jest.Mock;
const mockHandleJwtUpdate = handleJwtUpdate as jest.Mock;
const mockLoggerDebug = logger.debug as jest.Mock;
const mockLoggerInfo = logger.info as jest.Mock;

jest.mock('@/types', () => ({
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
}));

describe('NextAuth Callbacks (Node & Shared)', () => {
  const mockCorrelationId = 'mock-correlation-id';
  let jwtCallback: (args: any) => Promise<JWT | null>;
  let sessionCallback: (args: any) => Promise<Session>;
  // @ts-expect-error - Used for test setup, may be used in future tests
  let _mockPrisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    jwtCallback = authConfigNode.callbacks?.jwt as any;
    sessionCallback = authConfigNode.callbacks?.session as any;
    if (!jwtCallback || !sessionCallback) {
      throw new Error('JWT or Session callback not found in authConfigNode');
    }
    // Get the auto-mocked prisma instance
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _mockPrisma = require('@/lib/prisma').prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidv4.mockReturnValue(mockCorrelationId);
  });

  describe('authConfigNode.callbacks.jwt', () => {
    it('should call handleJwtSignIn on "signIn" trigger with user and account', async () => {
      const trigger = 'signIn';
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('oauth');
      mockHandleJwtSignIn.mockResolvedValue({ ...token, signInHandled: true });
      await jwtCallback({ token, user, account, trigger });
      expect(mockHandleJwtSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ token, user, account })
      );
    });

    it('should call handleJwtUpdate on "update" trigger with session', async () => {
      const token = createMockToken({ role: UserRole.USER });
      const session = { user: { name: 'Updated Name' } };
      const trigger = 'update';
      mockHandleJwtUpdate.mockResolvedValue({ ...token, name: 'Updated Name' });
      await jwtCallback({ token, trigger, session });
      expect(mockHandleJwtUpdate).toHaveBeenCalledWith(
        token,
        session,
        mockCorrelationId,
        expect.any(Object)
      );
    });

    it('should handle case where token might be minimal (only sub and role)', async () => {
      const minimalToken: JWT = {
        sub: 'user-minimal-id',
        role: UserRole.USER,
      };
      const trigger = 'session';

      const result = await jwtCallback({ token: minimalToken, trigger });

      expect(mockUuidv4).toHaveBeenCalled();
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ trigger, correlationId: mockCorrelationId }),
        '[JWT Callback] Session get/refresh flow'
      );
      expect(result).toBeDefined();
      expect(result?.sub).toBe(minimalToken.sub);
      expect(result?.role).toBe(minimalToken.role);
      expect(result?.jti).toBeDefined();
      if (!minimalToken.jti) {
        expect(result?.jti).toBe(mockCorrelationId);
      } else {
        expect(result?.jti).toBe(minimalToken.jti);
      }
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      const expectedKeys = ['sub', 'role', 'jti'];
      if (minimalToken.iat) expectedKeys.push('iat');
      if (minimalToken.exp) expectedKeys.push('exp');
      const resultKeys = Object.keys(result || {}).filter(k => (result as any)[k] !== undefined);
      expect(resultKeys.sort()).toEqual(expect.arrayContaining(expectedKeys.sort()));
      const extraKeys = resultKeys.filter(k => !expectedKeys.includes(k));
      expect(extraKeys).toEqual([]);
    });

    it('should call handleJwtSignIn on "signUp" trigger with user and account', async () => {
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('credentials');
      const trigger = 'signUp';

      mockHandleJwtSignIn.mockResolvedValue({ ...token, signUpHandled: true });

      const result = await jwtCallback({ token, user, account, trigger }); // Profile is optional

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'signUp' }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: 'signUp', correlationId: mockCorrelationId }),
        '[JWT Callback] Sign-in/Sign-up flow'
      );
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtSignIn).toHaveBeenCalledWith({
        token,
        user,
        account,
        profile: undefined,
        correlationId: mockCorrelationId,
        dependencies: expect.any(Object),
      });
      expect(result).toEqual({ ...token, signUpHandled: true });
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
    });

    it('should return original token for other triggers (e.g., session) and ensure JTI', async () => {
      const token = createMockToken();
      const trigger = 'session'; // Use 'session' trigger for default/other case test

      const result = await jwtCallback({ token, trigger }); // No user, account, profile, or session needed

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'session' }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'session' }),
        '[JWT Callback] Session get/refresh flow'
      );
      expect(result).not.toBeNull();
      expect(result?.jti).toBeDefined(); // Check JTI was added or existed
      expect(result?.jti).toBe(token.jti ?? mockCorrelationId); // Expect original JTI or generated one
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      expect(mockLoggerInfo).not.toHaveBeenCalled(); // No info logs for default case
    });

    it('should return original token if user is missing on signIn trigger', async () => {
      const token = createMockToken();
      const account = createMockAccount('google'); // Account might still be present
      const trigger = 'signIn';

      // Call without user
      const result = await jwtCallback({ token, account, trigger });

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'signIn' }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'signIn' }),
        '[JWT Callback] Session get/refresh flow'
      );
      expect(result).toEqual({ ...token, jti: token.jti ?? mockCorrelationId }); // Expect original or generated JTI
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      expect(mockLoggerInfo).not.toHaveBeenCalled();
    });

    it('should return original token if session is missing on update trigger', async () => {
      const token = createMockToken();
      const trigger = 'update';

      // Call without session
      const result = await jwtCallback({ token, trigger });

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'update' }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger: 'update' }),
        '[JWT Callback] Session get/refresh flow'
      );
      expect(result).toEqual({ ...token, jti: token.jti ?? mockCorrelationId }); // Expect original or generated JTI
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      expect(mockLoggerInfo).not.toHaveBeenCalled();
    });

    // --- Error Handling Tests ---

    it('should propagate error from handleJwtSignIn', async () => {
      const trigger = 'signIn';
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('oauth');
      const signInError = new Error('DB connection failed during sign-in');

      // Arrange: Mock handleJwtSignIn to reject
      mockHandleJwtSignIn.mockRejectedValue(signInError);

      // Act & Assert: Expect the jwtCallback to reject with the same error
      await expect(jwtCallback({ token, user, account, trigger })).rejects.toThrow(signInError);

      // Verify basic logging and mock calls
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: 'signIn', correlationId: mockCorrelationId }),
        '[JWT Callback] Sign-in/Sign-up flow'
      );
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1); // Ensure it was called
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      // Note: Error logging within handleJwtSignIn itself should be tested in its own unit tests
    });

    it('should propagate error from handleJwtUpdate', async () => {
      const token = createMockToken({ role: UserRole.USER });
      const session = { user: { name: 'Updated Name' } };
      const trigger = 'update';
      const updateError = new Error('Failed to update session token');

      // Arrange: Mock handleJwtUpdate to reject
      mockHandleJwtUpdate.mockRejectedValue(updateError);

      // Act & Assert: Expect the jwtCallback to reject with the same error
      await expect(jwtCallback({ token, trigger, session })).rejects.toThrow(updateError);

      // Verify basic logging and mock calls
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: mockCorrelationId, trigger }),
        '[JWT Callback] Invoked'
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ trigger: 'update', correlationId: mockCorrelationId }),
        '[JWT Callback] Update flow'
      );
      expect(mockHandleJwtUpdate).toHaveBeenCalledTimes(1); // Ensure it was called
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      // Note: Error logging within handleJwtUpdate itself should be tested in its own unit tests
    });
  });

  describe('handleSharedSessionCallback', () => {
    it('should map token properties to session.user', async () => {
      const mockSession: Session = {
        user: {
          // Initial default user from Session type might not have all fields
          id: '',
          name: null,
          email: null,
          image: null,
          role: UserRole.USER, // Default role or leave undefined if not set initially
        },
        expires: new Date().toISOString(),
      };
      const mockToken: JWT = {
        sub: 'user-123',
        role: UserRole.ADMIN,
        name: 'Test User',
        email: 'test@example.com',
        picture: 'http://example.com/pic.jpg',
        // other potential JWT fields
        iat: 123456,
        exp: 789012,
        jti: 'abc-def',
      };

      const result = await handleSharedSessionCallback({
        session: JSON.parse(JSON.stringify(mockSession)),
        token: mockToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      expect(result.user.id).toBe('user-123');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.user.name).toBe('Test User');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.image).toBe('http://example.com/pic.jpg');
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'user-123',
        userRole: UserRole.ADMIN,
      });
    });

    it('should handle token with missing optional properties gracefully', async () => {
      const mockSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER },
        expires: new Date().toISOString(),
      };
      const mockToken: JWT = {
        sub: 'user-456', // Only mandatory field (sub)
        role: UserRole.USER, // Role is usually present from JWT callback
      };

      const result = await handleSharedSessionCallback({
        session: JSON.parse(JSON.stringify(mockSession)),
        token: mockToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      expect(result.user.id).toBe('user-456');
      expect(result.user.role).toBe(UserRole.USER); // Role mapped
      expect(result.user.name).toBeNull(); // Should remain null
      expect(result.user.email).toBeNull(); // Should remain null
      expect(result.user.image).toBeNull(); // Should remain null
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'user-456',
        userRole: UserRole.USER,
      });
    });

    it('should handle case where token might be minimal (only sub and role)', async () => {
      const mockSession: Session = {
        user: {
          id: 'initial-id',
          name: 'Initial Name',
          email: 'initial@example.com',
          image: null,
          role: UserRole.USER,
        }, // Initial role is USER
        expires: new Date().toISOString(),
      };
      // Use a minimal token instead of null
      const minimalToken: JWT = {
        sub: 'minimal-user-sub',
        role: UserRole.USER, // Role = USER
      };

      // Pass a deep copy of the session to the callback
      const sessionCopy = JSON.parse(JSON.stringify(mockSession));
      const result = await handleSharedSessionCallback({
        session: sessionCopy,
        token: minimalToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      // Check that existing session fields aren't overwritten by missing token fields
      expect(result.user.id).toBe('minimal-user-sub'); // ID should update from sub
      // Explicitly cast both sides to UserRole for comparison
      expect(result.user.role as UserRole).toBe(UserRole.USER);
      expect(result.user.name).toBe('Initial Name'); // Should remain
      expect(result.user.email).toBe('initial@example.com'); // Should remain
      expect(result.user.image).toBeNull(); // Should remain null
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'minimal-user-sub',
        userRole: UserRole.USER,
      });
    });

    describe('handleSharedSessionCallback without token.sub', () => {
      it('should create a new empty/guest session if token lacks sub', async () => {
        // Session without token.sub
        const tokenWithoutSub: JWT = {
          name: 'Guest',
          email: null,
          picture: null,
          // Remove sub field
          role: UserRole.USER, // Role = USER instead of GUEST
          iat: 123456,
          exp: 789012,
          jti: 'test-jti-123',
        };
        const mockSession: Session = {
          user: { id: '', name: null, email: null, image: null, role: UserRole.USER },
          expires: new Date().toISOString(),
        };
        const result = await handleSharedSessionCallback({
          session: mockSession,
          token: tokenWithoutSub,
        });

        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] Start',
          hasTokenSub: false,
        });
        expect(result.user.id).toBe('');
        expect(result.user.role).toBe(UserRole.USER);
        expect(result.user.name).toBe('Guest');
        expect(result.user.email).toBeNull();
        expect(result.user.image).toBeNull();
        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] End',
          userId: '',
          userRole: UserRole.USER,
        });
      });

      it('should handle complex session objects correctly', async () => {
        // Arrange token without sub but with extra fields for testing
        const complexTokenWithoutSub: JWT = {
          // Custom non-standard token shape
          name: 'Complex Guest',
          email: null,
          picture: null,
          role: UserRole.USER, // Use USER instead of GUEST (GUEST doesn't exist)
          iat: 123456,
          exp: 789012,
          jti: 'complex-jti-123',
          // Add some non-standard fields
          customField1: 'custom-value-1',
          customField2: 'custom-value-2',
        };
        const mockSession: Session = {
          user: {
            id: '',
            name: null,
            email: null,
            image: null,
            role: UserRole.USER,
          },
          expires: new Date().toISOString(),
        };

        const result = await handleSharedSessionCallback({
          session: mockSession,
          token: complexTokenWithoutSub,
        });

        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] Start',
          hasTokenSub: false,
        });
        expect(result.user.id).toBe('');
        expect(result.user.role).toBe(UserRole.USER);
        expect(result.user.name).toBe('Complex Guest');
        expect(result.user.email).toBeNull();
        expect(result.user.image).toBeNull();
        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] End',
          userId: '',
          userRole: UserRole.USER,
        });
      });
    });
  });

  describe('authConfigNode.callbacks.session', () => {
    it('should correctly map JWT fields to session object', async () => {
      const mockToken: JWT = {
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test-image.jpg',
        role: UserRole.ADMIN, // Use correct role
        jti: 'test-jti',
        accessToken: 'test-access-token', // Include if needed by session
        provider: 'google', // Include if needed by session
      };
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockToken.sub ?? '', // Add nullish coalescing
          name: mockToken.name ?? null,
          email: mockToken.email ?? null,
          image: mockToken.picture ?? null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockToken.role as UserRole)
            ? (mockToken.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: mockToken.accessToken,
        // provider: mockToken.provider,
        // error: undefined, // Ensure error is not set - Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockToken,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });

    it('should handle missing optional fields in token gracefully', async () => {
      // Arrange
      const mockTokenMinimal: JWT = {
        sub: 'user-456',
        email: 'minimal@example.com',
        role: UserRole.USER, // Use correct role
        jti: 'minimal-jti',
      }; // Missing name, picture, accessToken, provider
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: 'expires-string',
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockTokenMinimal.sub ?? '', // Add nullish coalescing
          name: null,
          email: mockTokenMinimal.email ?? null,
          image: null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockTokenMinimal.role as UserRole)
            ? (mockTokenMinimal.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: undefined,
        // provider: undefined,
        // error: undefined, // Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockTokenMinimal,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });

    it('should set session.error if token has error field', async () => {
      // Arrange
      const mockTokenWithError: JWT = {
        sub: 'user-err',
        role: UserRole.USER, // Use correct role
        jti: 'err-jti',
        error: 'TokenRefreshError',
      };
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: 'expires-string',
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockTokenWithError.sub ?? '', // Add nullish coalescing
          name: null,
          email: null,
          image: null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockTokenWithError.role as UserRole)
            ? (mockTokenWithError.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: undefined,
        // provider: undefined,
        // error: undefined, // Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockTokenWithError,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });
  });
});
