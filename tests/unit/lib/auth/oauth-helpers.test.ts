/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { UserRole } from '@/types';
import { Account, Profile, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { AuthUserInternal, ValidateSignInResult } from '@/lib/auth/auth-helpers'; // Types from here are fine
import { OAuthDbUser } from '@/lib/auth/auth-jwt-types'; // Ensure this is the only import for this type

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  v4: mockUuidV4Instance,
}));

// Mock uuid
const mockUuidV4Instance = jest.fn<() => string>(() => 'mock-uuid-from-test-file');
jest.mock('uuid', () => ({
  __esModule: true,
  v4: mockUuidV4Instance,
}));

// --- Mock for oauth-validation-helpers --- //
const mockValidateOAuthInputsInternalDep = jest.fn();
jest.mock('@/lib/auth/oauth-validation-helpers', () => ({
  __esModule: true,
  validateOAuthInputs: mockValidateOAuthInputsInternalDep,
  createFallbackToken: jest.fn(),
  validateOAuthSignInInputs: jest.fn(),
  validateOAuthRequestInputs: jest.fn(),
}));

// Remove the jest.mock('@/lib/auth/auth-helpers', ...) block and related top-level mock function constants
// as they were causing issues and might not be needed with the current SUT import strategy.
// Types like AuthUserInternal are imported directly from '@/lib/auth/auth-helpers' above.

const mockCorrelationId = 'test-correlation-id';
const mockProfile: Profile = {
  name: 'Test User',
  email: 'test@example.com',
  sub: 'mock-sub',
  image: 'https://example.com/avatar.jpg',
};
const mockUser: NextAuthUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  role: UserRole.USER,
};
const mockAccount: Account = {
  provider: 'google',
  type: 'oauth',
  providerAccountId: 'mock-provider-id',
};
const mockAuthUserInternalGlobal: AuthUserInternal = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  role: UserRole.USER,
};

// Logger instance to be used within the test scope, re-assigned in beforeEach
let testScopeLogger: {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  child: jest.Mock;
};

const createMockOAuthDbUser = (overrides: Partial<OAuthDbUser> = {}): OAuthDbUser => {
  const baseUserProperties = {
    userId: mockAuthUserInternalGlobal.id,
    userEmail: mockAuthUserInternalGlobal.email as string,
    name: mockAuthUserInternalGlobal.name,
    image: mockAuthUserInternalGlobal.image,
    role: mockAuthUserInternalGlobal.role,
    // Add any other non-firebaseUid properties from OAuthDbUser if they are consistently mocked or defaulted
  };

  // Ensure firebaseUid is a string. If overrides provides it as a string, use that. Otherwise, use a default.
  const firebaseUid =
    typeof overrides.firebaseUid === 'string'
      ? overrides.firebaseUid
      : `mock-firebase-uid-for-${mockAuthUserInternalGlobal.id}`; // Default string value

  return {
    ...baseUserProperties,
    ...overrides, // Spread overrides to get other properties or override base ones
    firebaseUid, // Explicitly set firebaseUid to ensure it's a string, potentially overwriting if override was undefined
  };
};

describe('OAuth Helpers', () => {
  let oauthHelpersModuleSUT: typeof import('@/lib/auth/oauth-helpers');
  let SUTDefaultDepsFromJwtTypes: typeof import('@/lib/auth/auth-jwt-types').defaultDependencies;

  beforeEach(() => {
    jest.resetModules();
    oauthHelpersModuleSUT = require('@/lib/auth/oauth-helpers');
    // Re-acquire the logger instance that the SUT will use after resetModules
    testScopeLogger = require('@/lib/logger').logger;
    SUTDefaultDepsFromJwtTypes = require('@/lib/auth/auth-jwt-types').defaultDependencies;

    jest.clearAllMocks(); // This clears all mocks, including those on testScopeLogger if they are jest.fn()
    // However, it's safer to clear them explicitly or ensure they are fresh jest.fn() from the mock factory.
    // The mock factory for @/lib/logger creates new jest.fn()s each time, so jest.clearAllMocks() might be okay.
    // For clarity and safety, let's also call .mockClear() on the re-acquired logger methods.
    testScopeLogger.debug.mockClear();
    testScopeLogger.info.mockClear();
    testScopeLogger.warn.mockClear();
    testScopeLogger.error.mockClear();
    testScopeLogger.child.mockClear().mockReturnThis();

    mockUuidV4Instance.mockClear().mockReturnValue('mock-uuid-from-test-file');
    // (rootMockedLogger.debug as jest.Mock).mockClear(); // Remove old logger clears
    // (rootMockedLogger.info as jest.Mock).mockClear();
    // (rootMockedLogger.warn as jest.Mock).mockClear();
    // (rootMockedLogger.error as jest.Mock).mockClear();
    // (rootMockedLogger.child as jest.Mock).mockClear().mockReturnThis();
  });

  describe('performDbFindOrCreateUser', () => {
    it('should call findOrCreateUser from dependencies with correct parameters', async () => {
      const mockDepFindOrCreateUser = jest
        .fn<typeof SUTDefaultDepsFromJwtTypes.findOrCreateUser>()
        .mockResolvedValueOnce(mockAuthUserInternalGlobal);
      const profileData = { id: 'user-id-123', email: 'test@example.com' };
      const result = await oauthHelpersModuleSUT.performDbFindOrCreateUser({
        email: 'test@example.com',
        profileData,
        providerAccountId: 'mock-provider-id',
        provider: 'google',
        correlationId: mockCorrelationId,
        dependencies: { findOrCreateUser: mockDepFindOrCreateUser },
      });
      expect(mockDepFindOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
      expect(result).toEqual(mockAuthUserInternalGlobal);
    });
    // ... other tests ...
  });

  describe('findOrCreateOAuthDbUser', () => {
    it('should correctly find or create a user if internal validation passes', async () => {
      mockValidateOAuthInputsInternalDep.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email as string,
      });

      const originalSutFindOrCreateUser = SUTDefaultDepsFromJwtTypes.findOrCreateUser;
      const originalSutPrepareProfile = SUTDefaultDepsFromJwtTypes.prepareProfile;

      SUTDefaultDepsFromJwtTypes.findOrCreateUser = jest
        .fn<typeof originalSutFindOrCreateUser>()
        .mockResolvedValue(mockAuthUserInternalGlobal);
      SUTDefaultDepsFromJwtTypes.prepareProfile = jest
        .fn<typeof originalSutPrepareProfile>()
        .mockReturnValue({ id: 'p1', email: 'e1' } as any); // Cast to any if type is complex

      const result = await oauthHelpersModuleSUT.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
      });

      expect(mockValidateOAuthInputsInternalDep).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        mockCorrelationId
      );
      expect(SUTDefaultDepsFromJwtTypes.prepareProfile).toHaveBeenCalled();
      expect(SUTDefaultDepsFromJwtTypes.findOrCreateUser).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ userId: mockAuthUserInternalGlobal.id }));

      SUTDefaultDepsFromJwtTypes.findOrCreateUser = originalSutFindOrCreateUser;
      SUTDefaultDepsFromJwtTypes.prepareProfile = originalSutPrepareProfile;
    });

    it('should return null if internal validateOAuthInputs (mocked) fails', async () => {
      mockValidateOAuthInputsInternalDep.mockReturnValue({ isValid: false });
      const result = await oauthHelpersModuleSUT.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
      });
      expect(result).toBeNull();
      expect(mockValidateOAuthInputsInternalDep).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        mockCorrelationId
      );
    });
  });

  describe('handleOAuthSignIn', () => {
    it('should process OAuth sign-in and return true on success', async () => {
      const originalValidateInputs = SUTDefaultDepsFromJwtTypes.validateInputs;
      const originalFindOrCreateUser = SUTDefaultDepsFromJwtTypes.findOrCreateUser;
      const originalPrepareProfile = SUTDefaultDepsFromJwtTypes.prepareProfile;

      SUTDefaultDepsFromJwtTypes.validateInputs = jest
        .fn<typeof originalValidateInputs>()
        .mockReturnValue({ isValid: true, userId: mockUser.id, userEmail: mockUser.email });
      mockValidateOAuthInputsInternalDep.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email as string,
      });
      SUTDefaultDepsFromJwtTypes.findOrCreateUser = jest
        .fn<typeof originalFindOrCreateUser>()
        .mockResolvedValue(mockAuthUserInternalGlobal);
      SUTDefaultDepsFromJwtTypes.prepareProfile = jest
        .fn<typeof originalPrepareProfile>()
        .mockReturnValue({ id: 'p1', email: 'e1' } as any);

      const result = await oauthHelpersModuleSUT.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
      });

      expect(SUTDefaultDepsFromJwtTypes.validateInputs).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        mockCorrelationId
      );
      expect(mockValidateOAuthInputsInternalDep).toHaveBeenCalled();
      expect(result).toBe(true);

      SUTDefaultDepsFromJwtTypes.validateInputs = originalValidateInputs;
      SUTDefaultDepsFromJwtTypes.findOrCreateUser = originalFindOrCreateUser;
      SUTDefaultDepsFromJwtTypes.prepareProfile = originalPrepareProfile;
    });
  });

  describe('createOAuthSignInCallback (SUT)', () => {
    const sampleUser: NextAuthUser = {
      id: 'user1',
      email: 'user@example.com',
      name: 'Test User',
      image: 'img.jpg',
      role: UserRole.USER,
    };
    const sampleAccount: Account = {
      provider: 'google',
      type: 'oauth',
      providerAccountId: 'acc123',
    };
    const sampleProfile: Profile = {
      name: 'Test User',
      email: 'user@example.com',
      image: 'img.jpg',
      sub: 'sub123',
    };
    const sampleJwt: JWT = { sub: 'user1', jti: 'jwt123' }; // Original session JWT
    const sampleToken: JWT = { accessToken: 'token123', jti: 'token-jti123' }; // Provider token

    const createMockAuthUserInternalLocal = (
      overrides: Partial<AuthUserInternal> = {}
    ): AuthUserInternal => ({
      id: 'default-internal-id',
      email: 'internal@example.com',
      name: 'Internal User',
      image: 'internal.jpg',
      role: UserRole.USER,
      ...overrides,
    });

    // Test 1: Account is null
    it('returned callback should log warn and return original provider token if account is null', async () => {
      const specificCorrelationId = 'corr-id-null-account';
      // mockUuidV4Instance is NOT called for JTI in this path, only for correlationId if not provided.
      // Since specificCorrelationId is provided, uuidv4 from dependencies won't be called for it by createOAuthSignInCallback.
      // And since we return `sampleToken` directly, no new JTI is generated via uuidv4.

      const mockLocalValidateInputs = jest.fn<typeof SUTDefaultDepsFromJwtTypes.validateInputs>(); // Not called in this path

      const mockPassedInDeps = {
        findOrCreateUser: jest.fn<typeof SUTDefaultDepsFromJwtTypes.findOrCreateUser>(), // Not called
        prepareProfile: jest.fn<typeof SUTDefaultDepsFromJwtTypes.prepareProfile>(), // Not called
        validateInputs: mockLocalValidateInputs,
        uuidv4: mockUuidV4Instance, // Available, but not used by the callback logic in this path
      };

      const actualSignInCallback = oauthHelpersModuleSUT.createOAuthSignInCallback({
        jwt: sampleJwt,
        token: sampleToken,
        user: sampleUser,
        account: null,
        profile: sampleProfile,
        correlationId: specificCorrelationId,
        dependencies: mockPassedInDeps,
      });
      const resultToken = await actualSignInCallback();

      expect(testScopeLogger.warn).toHaveBeenCalledTimes(1);
      expect(testScopeLogger.warn).toHaveBeenCalledWith(
        { correlationId: specificCorrelationId },
        'OAuth callback received null account, returning original token'
      );
      expect(mockLocalValidateInputs).not.toHaveBeenCalled();
      expect(resultToken).toEqual(sampleToken); // Should return the original provider token
      expect(mockUuidV4Instance).not.toHaveBeenCalled(); // No JTI generated, correlationId was provided
    });

    // Test 2: Internal validateInputs returns isValid:false
    it('returned callback should log warn and return minimal token if localDeps.validateInputs returns isValid:false', async () => {
      const specificCorrelationId = 'corr-id-validate-inputs-false';
      const validationErrorMsg = 'Test: localDeps.validateInputs explicitly false';

      mockUuidV4Instance.mockReturnValueOnce('uuid-for-invalid-inputs-jti');

      const mockLocalValidateInputs = jest
        .fn<typeof SUTDefaultDepsFromJwtTypes.validateInputs>()
        .mockReturnValue({ isValid: false, error: validationErrorMsg } as ValidateSignInResult);

      const mockPassedInDeps = {
        findOrCreateUser: jest.fn<typeof SUTDefaultDepsFromJwtTypes.findOrCreateUser>(), // Not called
        prepareProfile: jest.fn<typeof SUTDefaultDepsFromJwtTypes.prepareProfile>(), // Not called
        validateInputs: mockLocalValidateInputs,
        uuidv4: mockUuidV4Instance,
      };

      const actualSignInCallback = oauthHelpersModuleSUT.createOAuthSignInCallback({
        jwt: sampleJwt,
        token: sampleToken,
        user: sampleUser,
        account: sampleAccount,
        profile: sampleProfile,
        correlationId: specificCorrelationId,
        dependencies: mockPassedInDeps,
      });
      const resultToken = await actualSignInCallback();

      expect(mockLocalValidateInputs).toHaveBeenCalledWith(
        sampleUser,
        sampleAccount,
        specificCorrelationId
      );
      expect(testScopeLogger.warn).toHaveBeenCalledTimes(1);
      expect(testScopeLogger.warn).toHaveBeenCalledWith(
        { correlationId: specificCorrelationId, provider: sampleAccount.provider },
        'OAuth callback validation failed'
      );
      expect(resultToken).toEqual({ jti: 'uuid-for-invalid-inputs-jti' }); // Minimal token, does not spread original JWT
      expect(mockUuidV4Instance).toHaveBeenCalledTimes(1); // For the JTI
    });

    // Test 3: Success path
    it('returned callback should proceed if localDeps.validateInputs passes, and process user to create JWT', async () => {
      const specificCorrelationId = 'corr-id-internal-validation-passes';
      const successfulAuthUser = createMockAuthUserInternalLocal({
        id: sampleUser.id,
        email: sampleUser.email as string,
        name: sampleUser.name,
        image: sampleUser.image,
        role: sampleUser.role,
      });

      // This uuid is for the JTI in the final successful JWT
      mockUuidV4Instance.mockReturnValue('uuid-for-successful-jti');

      const mockLocalValidateInputs = jest
        .fn<typeof SUTDefaultDepsFromJwtTypes.validateInputs>()
        .mockReturnValue({
          isValid: true,
          userId: sampleUser.id,
          userEmail: sampleUser.email as string,
        });

      const mockLocalFindOrCreateUser = jest
        .fn<typeof SUTDefaultDepsFromJwtTypes.findOrCreateUser>()
        .mockResolvedValue(successfulAuthUser);

      const mockLocalPrepareProfile = jest
        .fn<typeof SUTDefaultDepsFromJwtTypes.prepareProfile>()
        .mockReturnValue({
          id: sampleUser.id,
          email: sampleUser.email as string,
          name: sampleUser.name,
          image: sampleUser.image,
        } as any);

      // Mock for validateOAuthInputs (from oauth-validation-helpers) used by findOrCreateOAuthDbUser
      // It should also return true for the success path of findOrCreateOAuthDbUser.
      mockValidateOAuthInputsInternalDep.mockReturnValue({
        isValid: true,
        userId: sampleUser.id,
        userEmail: sampleUser.email as string,
      });

      const mockPassedInDeps = {
        findOrCreateUser: mockLocalFindOrCreateUser,
        prepareProfile: mockLocalPrepareProfile,
        validateInputs: mockLocalValidateInputs,
        uuidv4: mockUuidV4Instance,
      };

      const actualSignInCallback = oauthHelpersModuleSUT.createOAuthSignInCallback({
        jwt: sampleJwt,
        token: sampleToken,
        user: sampleUser,
        account: sampleAccount,
        profile: sampleProfile,
        correlationId: specificCorrelationId,
        dependencies: mockPassedInDeps,
      });
      const resultToken = await actualSignInCallback();

      expect(mockLocalValidateInputs).toHaveBeenCalledWith(
        sampleUser,
        sampleAccount,
        specificCorrelationId
      );
      // findOrCreateOAuthDbUser (called by processOauthUserAndCreateJwt) uses its own import of validateOAuthInputs
      expect(mockValidateOAuthInputsInternalDep).toHaveBeenCalledWith(
        sampleUser,
        sampleAccount,
        specificCorrelationId
      );

      expect(mockLocalPrepareProfile).toHaveBeenCalled();
      expect(mockLocalFindOrCreateUser).toHaveBeenCalled();

      expect(resultToken).toEqual(
        expect.objectContaining({
          ...sampleJwt, // Original JWT is spread
          sub: successfulAuthUser.id,
          name: successfulAuthUser.name,
          email: successfulAuthUser.email,
          picture: successfulAuthUser.image,
          role: successfulAuthUser.role,
          jti: 'uuid-for-successful-jti', // New JTI
          userId: successfulAuthUser.id,
          userRole: successfulAuthUser.role,
        })
      );

      // Check for the logger.info call in the success path from processOauthUserAndCreateJwt
      expect(testScopeLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: specificCorrelationId,
          msg: 'OAuth callback successful, creating new JWT payload',
          provider: sampleAccount.provider,
          userId: successfulAuthUser.id,
        })
      );

      // So, for the success path, `mockUuidV4Instance` should be called ONCE for the JTI from `processOauthUserAndCreateJwt`.
      expect(mockUuidV4Instance).toHaveBeenCalledTimes(1);
    });
  });

  describe('createOAuthJwtPayload', () => {
    const mockBaseToken: JWT = { jti: 'base-jti' };
    const mockProvider = 'google';
    const mockUuid = 'mock-jwt-uuid';
    const mockPassThruDeps = { uuidv4: jest.fn(() => mockUuid) }; // Changed name to avoid clash
    beforeEach(() => {
      mockPassThruDeps.uuidv4.mockClear().mockReturnValue(mockUuid);
      // Clear the testScopeLogger.info if it has been initialized by the outer beforeEach
      if (testScopeLogger && testScopeLogger.info) {
        testScopeLogger.info.mockClear();
      }
    });
    it('should create a JWT payload with UserRole.USER if dbUser.role is undefined', () => {
      const dbUserWithoutRole = createMockOAuthDbUser({ role: undefined });
      const result = oauthHelpersModuleSUT.createOAuthJwtPayload({
        _baseToken: mockBaseToken,
        dbUser: dbUserWithoutRole,
        provider: mockProvider,
        correlationId: mockCorrelationId,
        dependencies: mockPassThruDeps,
      });
      expect(result.role).toBe(UserRole.USER);
      expect(testScopeLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: dbUserWithoutRole.userId,
          correlationId: mockCorrelationId,
          provider: mockProvider,
          msg: 'Creating OAuth JWT payload',
        })
      );
    });
    it('should create a JWT payload with the specified role if dbUser.role is present', () => {
      const dbUserWithAdminRole = createMockOAuthDbUser({ role: UserRole.ADMIN });
      const result = oauthHelpersModuleSUT.createOAuthJwtPayload({
        _baseToken: mockBaseToken,
        dbUser: dbUserWithAdminRole,
        provider: mockProvider,
        correlationId: mockCorrelationId,
        dependencies: mockPassThruDeps,
      });
      expect(result.role).toBe(UserRole.ADMIN);
      expect(testScopeLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: dbUserWithAdminRole.userId,
          correlationId: mockCorrelationId,
          provider: mockProvider,
          msg: 'Creating OAuth JWT payload',
        })
      );
    });
  });
});
