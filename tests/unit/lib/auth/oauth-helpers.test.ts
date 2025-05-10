/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { UserRole } from '@/types';
import { Account, Profile, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { defaultDependencies as actualDefaultDependencies } from '@/lib/auth/auth-jwt-types';
import {
  validateSignInInputs as actualValidateSignInInputs,
  AuthUserInternal,
} from '@/lib/auth/auth-helpers'; // Ensure AuthUserInternal is imported if used by mock types

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

// Define the explicit jest.fn() for uuid.v4 that will be used
const mockUuidV4Instance = jest.fn(() => 'mock-uuid-from-test-file');

// Mock uuid to use our specific mockUuidV4Instance
jest.mock('uuid', () => ({
  __esModule: true, // Indicate it's an ES module for mocking purposes
  v4: mockUuidV4Instance, // Override v4 with our mock instance
}));

// Mock auth-helpers (for dependencies like validateSignInInputs, prepareProfile, findOrCreateUser from defaultDependencies)
jest.mock('@/lib/auth/auth-helpers');

// Import the actual module to be tested
import * as oauthHelpersModuleActual from '@/lib/auth/oauth-helpers';
import * as oauthValidationHelpersModuleActual from '@/lib/auth/oauth-validation-helpers';
import { defaultDependencies, OAuthDbUser } from '@/lib/auth/auth-jwt-types';

interface MockedAuthHelpers {
  findOrCreateUserAndAccountInternal: jest.MockedFunction<
    typeof defaultDependencies.findOrCreateUser
  >;
  prepareProfileDataForDb: jest.MockedFunction<typeof defaultDependencies.prepareProfile>;
  validateSignInInputs: jest.MockedFunction<typeof defaultDependencies.validateInputs>;
}

const getMocks = () => {
  const helpersMod = jest.requireMock('@/lib/auth/auth-helpers') as MockedAuthHelpers;
  return {
    findOrCreateUser: helpersMod.findOrCreateUserAndAccountInternal,
    prepareProfile: helpersMod.prepareProfileDataForDb,
    validateInputs: helpersMod.validateSignInInputs,
  };
};

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
const mockAuthUserInternal: AuthUserInternal = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  role: UserRole.USER,
};

// Helper to create a valid OAuthDbUser for mock return values
const createMockOAuthDbUser = (overrides: Partial<OAuthDbUser> = {}): OAuthDbUser => ({
  userId: mockAuthUserInternal.id,
  userEmail: mockAuthUserInternal.email as string,
  name: mockAuthUserInternal.name,
  image: mockAuthUserInternal.image,
  role: mockAuthUserInternal.role,
  ...overrides,
});

type MockedDefaultDependencies = {
  findOrCreateUser: jest.MockedFunction<typeof actualDefaultDependencies.findOrCreateUser>;
  prepareProfile: jest.MockedFunction<typeof actualDefaultDependencies.prepareProfile>;
  validateInputs: jest.MockedFunction<typeof actualDefaultDependencies.validateInputs>;
  uuidv4: jest.Mock<() => string>; // This should now correctly refer to mockUuidV4Instance
};

// interface HandleOAuthTestDependencies { // THIS IS THE UNUSED INTERFACE, remove or comment out
//   validateInputs: jest.MockedFunction<typeof actualValidateSignInInputs>;
//   uuidv4: jest.Mock<() => string>;
// }

describe('OAuth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidV4Instance.mockClear().mockReturnValue('mock-uuid-from-test-file');
    // No spy reset needed here as it's removed.
  });

  describe('validateOAuthInputs (actual implementation)', () => {
    it('should return valid result with all fields present', () => {
      const result = oauthValidationHelpersModuleActual.validateOAuthInputs(
        mockUser,
        mockAccount,
        mockCorrelationId
      );
      expect(result).toEqual({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email,
      });
    });
    it('should return invalid result with missing user', () => {
      const result = oauthValidationHelpersModuleActual.validateOAuthInputs(
        null,
        mockAccount,
        mockCorrelationId
      );
      expect(result).toEqual({
        isValid: false,
      });
    });
    it('should return invalid result with missing email', () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      const result = oauthValidationHelpersModuleActual.validateOAuthInputs(
        userWithoutEmail,
        mockAccount,
        mockCorrelationId
      );
      expect(result).toEqual({
        isValid: false,
      });
    });
    it('should return invalid result with missing account', () => {
      const result = oauthValidationHelpersModuleActual.validateOAuthInputs(
        mockUser,
        null,
        mockCorrelationId
      );
      expect(result).toEqual({
        isValid: false,
      });
    });
  });

  describe('performDbFindOrCreateUser (actual implementation)', () => {
    const mocks = getMocks();
    beforeEach(() => {
      mocks.findOrCreateUser.mockReset();
    });

    it('should call findOrCreateUser from dependencies with correct parameters', async () => {
      mocks.findOrCreateUser.mockResolvedValueOnce(mockAuthUserInternal);
      const profileData = { id: 'user-id-123', email: 'test@example.com' };

      const result = await oauthHelpersModuleActual.performDbFindOrCreateUser({
        email: 'test@example.com',
        profileData,
        providerAccountId: 'mock-provider-id',
        provider: 'google',
        correlationId: mockCorrelationId,
        dependencies: {
          findOrCreateUser: mocks.findOrCreateUser,
        },
      });

      expect(mocks.findOrCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        profileData,
        providerAccountId: 'mock-provider-id',
        provider: 'google',
        correlationId: mockCorrelationId,
      });
      expect(result).toEqual(mockAuthUserInternal);
    });
  });

  describe('findOrCreateOAuthDbUser', () => {
    const {
      prepareProfile: prepareProfileMock,
      findOrCreateUser: findOrCreateUserMock,
      validateInputs: validateInputsMock,
    } = getMocks();

    const createDependenciesForSUT = (): MockedDefaultDependencies => ({
      findOrCreateUser: findOrCreateUserMock,
      prepareProfile: prepareProfileMock,
      validateInputs: validateInputsMock,
      uuidv4: mockUuidV4Instance,
    });

    beforeEach(() => {
      // These are mocks for dependencies of findOrCreateOAuthDbUser
      prepareProfileMock.mockReset();
      findOrCreateUserMock.mockReset();
      validateInputsMock.mockReset();
      mockUuidV4Instance.mockClear().mockReturnValue('mock-uuid-from-test-file');

      prepareProfileMock.mockReturnValue({
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      });
      findOrCreateUserMock.mockResolvedValue(mockAuthUserInternal);
    });

    it('should correctly find or create a user and transform to OAuthDbUser on valid inputs', async () => {
      const testSUTDependencies = createDependenciesForSUT();
      const specificPreparedProfile = {
        id: 'prepared-profile-id',
        email: mockUser.email as string,
        name: 'Prepared Name',
        image: 'prepared.jpg',
      };
      prepareProfileMock.mockReturnValue(specificPreparedProfile);
      const internalDbUser = { ...mockAuthUserInternal, id: 'final-db-id', name: 'Final DB Name' };
      findOrCreateUserMock.mockResolvedValue(internalDbUser);

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(prepareProfileMock).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockProfile,
        mockUser
      );
      expect(findOrCreateUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email,
          profileData: specificPreparedProfile,
        })
      );
      expect(result).toEqual({
        userId: internalDbUser.id,
        userEmail: internalDbUser.email,
        name: internalDbUser.name,
        image: internalDbUser.image,
        role: internalDbUser.role,
      });
    });

    it('should return null if internal validateOAuthInputs fails (e.g. no user email)', async () => {
      const testSUTDependencies = createDependenciesForSUT();
      const userWithoutEmail = { ...mockUser, email: null };

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: userWithoutEmail as NextAuthUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });
      expect(result).toBeNull();
      expect(prepareProfileMock).not.toHaveBeenCalled();
      expect(findOrCreateUserMock).not.toHaveBeenCalled();
    });

    it('should return null if internal performDbFindOrCreateUser returns null (e.g., findOrCreateUser dependency fails)', async () => {
      const testSUTDependencies = createDependenciesForSUT();
      findOrCreateUserMock.mockResolvedValue(null);

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(result).toBeNull();
      expect(prepareProfileMock).toHaveBeenCalled();
      expect(findOrCreateUserMock).toHaveBeenCalled();
    });

    it('should return null if internal performDbFindOrCreateUser throws (e.g., findOrCreateUser dependency throws)', async () => {
      const testSUTDependencies = createDependenciesForSUT();
      const dbError = new Error('DB error');
      findOrCreateUserMock.mockRejectedValue(dbError);

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(result).toBeNull();
      expect(prepareProfileMock).toHaveBeenCalled();
      expect(findOrCreateUserMock).toHaveBeenCalled();
    });
  });

  describe('handleOAuthSignIn (actual implementation)', () => {
    // Use locally defined mocks for this suite to ensure clarity and isolation
    let localValidateInputsMock: jest.MockedFunction<typeof actualValidateSignInInputs>;
    let localPrepareProfileMock: jest.MockedFunction<typeof defaultDependencies.prepareProfile>;
    let localFindOrCreateUserMock: jest.MockedFunction<typeof defaultDependencies.findOrCreateUser>;

    // This type should reflect what handleOAuthSignIn expects for its dependencies param
    interface HandleOAuthSignInTestDependencies {
      validateInputs: jest.MockedFunction<typeof actualValidateSignInInputs>;
      prepareProfile: jest.MockedFunction<typeof defaultDependencies.prepareProfile>;
      findOrCreateUser: jest.MockedFunction<typeof defaultDependencies.findOrCreateUser>;
      uuidv4: jest.Mock<() => string>;
    }

    beforeEach(() => {
      // Initialize fresh mocks for each test in this suite
      localValidateInputsMock = jest.fn<typeof actualValidateSignInInputs>();
      localPrepareProfileMock = jest.fn<typeof defaultDependencies.prepareProfile>();
      localFindOrCreateUserMock = jest.fn<typeof defaultDependencies.findOrCreateUser>();

      mockUuidV4Instance.mockClear().mockReturnValue('mock-uuid-from-handleOAuthSignIn');

      // Default successful path setup for these local mocks
      localValidateInputsMock.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email,
      });
      localPrepareProfileMock.mockReturnValue({
        id: 'prepared-user-id',
        email: 'test@example.com',
        name: 'Prepared User',
        image: 'prepared.jpg',
      });
      localFindOrCreateUserMock.mockResolvedValue(mockAuthUserInternal);
    });

    const createHandleSignInDeps = (): HandleOAuthSignInTestDependencies => ({
      validateInputs: localValidateInputsMock,
      prepareProfile: localPrepareProfileMock,
      findOrCreateUser: localFindOrCreateUserMock,
      uuidv4: mockUuidV4Instance,
    });

    it('should process OAuth sign-in and return true on success', async () => {
      // BeforeEach already sets up mocks for success. Can override if needed.
      const testSUTDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        isNewUser: false,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(localValidateInputsMock).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        mockCorrelationId
      );
      // Check dependencies of findOrCreateOAuthDbUser were called
      expect(localPrepareProfileMock).toHaveBeenCalled();
      expect(localFindOrCreateUserMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should use generated correlationId if not provided and call dependencies of findOrCreateOAuthDbUser', async () => {
      // BeforeEach sets mocks for success. uuid is handled by mockUuidV4Instance.
      const testSUTDependencies = createHandleSignInDeps();
      // Ensure mockUuidV4Instance is primed for this specific call if different from beforeEach
      mockUuidV4Instance.mockClear().mockReturnValueOnce('generated-uuid-for-signin');

      await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        // No providedCorrelationId, so SUT should generate one using its uuidv4
        dependencies: testSUTDependencies,
      });
      // Check if validateInputs was called with *any* string for correlationId for now
      expect(localValidateInputsMock).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        expect.any(String)
      );
      expect(mockUuidV4Instance).toHaveBeenCalledTimes(1); // Once for correlation ID
      // Check dependencies of findOrCreateOAuthDbUser were called
      expect(localPrepareProfileMock).toHaveBeenCalled();
      expect(localFindOrCreateUserMock).toHaveBeenCalled();
    });

    it('should return false if validation fails', async () => {
      localValidateInputsMock.mockReturnValue({ isValid: false }); // Override for this test
      const testSUTDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        dependencies: testSUTDependencies,
      });
      expect(result).toBe(false);
      expect(localPrepareProfileMock).not.toHaveBeenCalled();
      expect(localFindOrCreateUserMock).not.toHaveBeenCalled();
    });

    it('should return false if findOrCreateOAuthDbUser (via its dependencies) effectively returns null', async () => {
      // localValidateInputsMock is fine from beforeEach (isValid: true)
      // localPrepareProfileMock is fine from beforeEach (returns valid profile)
      localFindOrCreateUserMock.mockResolvedValue(null); // Override for this test
      const testSUTDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        dependencies: testSUTDependencies,
        correlationId: mockCorrelationId,
      });
      expect(result).toBe(false);
      expect(localPrepareProfileMock).toHaveBeenCalled();
      expect(localFindOrCreateUserMock).toHaveBeenCalled();
    });
  });

  describe('createOAuthSignInCallback (actual implementation)', () => {
    const { prepareProfile: prepareProfileMock, findOrCreateUser: findOrCreateUserMock } =
      getMocks();
    const mockValidateInputsCallback = jest.fn<typeof actualValidateSignInInputs>();

    // This type should reflect what createOAuthSignInCallback expects for its dependencies param
    interface CreateOAuthCallbackTestDependencies {
      validateInputs: jest.MockedFunction<typeof actualValidateSignInInputs>;
      prepareProfile: jest.MockedFunction<typeof defaultDependencies.prepareProfile>;
      findOrCreateUser: jest.MockedFunction<typeof defaultDependencies.findOrCreateUser>;
      uuidv4: jest.Mock<() => string>;
    }

    const createCallbackDeps = (): CreateOAuthCallbackTestDependencies => ({
      validateInputs: mockValidateInputsCallback,
      prepareProfile: prepareProfileMock,
      findOrCreateUser: findOrCreateUserMock,
      uuidv4: mockUuidV4Instance,
    });

    beforeEach(() => {
      mockValidateInputsCallback.mockReset();
      // Reset mocks for dependencies of the *actual* findOrCreateOAuthDbUser
      prepareProfileMock.mockReset();
      findOrCreateUserMock.mockReset();
      mockUuidV4Instance.mockClear().mockReturnValue('mock-uuid-from-createCallback');

      // Default successful path for findOrCreateOAuthDbUser's dependencies
      prepareProfileMock.mockReturnValue({
        id: 'prepared-callback-user-id',
        email: 'callback-test@example.com',
        name: 'Prepared Callback User',
        image: 'callback-prepared.jpg',
      });
      // This will be used by the actual findOrCreateOAuthDbUser
      const internalUserForCallback: AuthUserInternal = {
        id: 'callback-user-id',
        email: 'callback-test@example.com',
        name: 'Callback User Name',
        image: 'callback-image.jpg',
        role: UserRole.ADMIN,
      };
      findOrCreateUserMock.mockResolvedValue(internalUserForCallback);
    });

    it('should create a function that processes OAuth callback and returns updated token', async () => {
      mockValidateInputsCallback.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email,
      });
      // Configure mocks for dependencies of findOrCreateOAuthDbUser for this specific test if needed,
      // otherwise, rely on beforeEach.
      // For example, to match the expectedOAuthUser more closely:
      const specificExpectedOAuthUser = createMockOAuthDbUser({
        userId: 'callback-user-id',
        userEmail: 'callback-test@example.com',
        name: 'Callback User Name',
        image: 'callback-image.jpg',
        role: UserRole.ADMIN,
      });
      // findOrCreateUserMock.mockResolvedValue(specificExpectedOAuthUser); // No, findOrCreateUser returns AuthUserInternal
      // The mapping to OAuthDbUser happens inside findOrCreateOAuthDbUser.
      // So, findOrCreateUserMock should return an AuthUserInternal that would map to specificExpectedOAuthUser.
      const correspondingAuthUserInternal: AuthUserInternal = {
        id: specificExpectedOAuthUser.userId,
        email: specificExpectedOAuthUser.userEmail,
        name: specificExpectedOAuthUser.name,
        image: specificExpectedOAuthUser.image,
        role: specificExpectedOAuthUser.role as UserRole,
      };
      findOrCreateUserMock.mockResolvedValue(correspondingAuthUserInternal);

      const testSUTDependencies = createCallbackDeps();
      const initialToken: JWT = { sub: 'existing-sub', name: 'Old Name', jti: 'old-jti' };
      // The expectedOAuthUser is what we anticipate findOrCreateOAuthDbUser to produce,
      // based on its internal logic and its mocked dependencies.

      const signInCallback = oauthHelpersModuleActual.createOAuthSignInCallback({
        jwt: initialToken,
        token: initialToken,
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: 'callback-correlation-id',
        dependencies: testSUTDependencies,
      });

      expect(typeof signInCallback).toBe('function');
      const resultToken = await signInCallback();

      expect(mockValidateInputsCallback).toHaveBeenCalledWith(
        mockUser,
        mockAccount,
        'callback-correlation-id'
      );
      // Check dependencies that findOrCreateOAuthDbUser should have used
      expect(prepareProfileMock).toHaveBeenCalled();
      expect(findOrCreateUserMock).toHaveBeenCalled();

      expect(resultToken).toEqual(
        expect.objectContaining({
          sub: specificExpectedOAuthUser.userId,
          name: specificExpectedOAuthUser.name,
          email: specificExpectedOAuthUser.userEmail,
          picture: specificExpectedOAuthUser.image,
          role: specificExpectedOAuthUser.role,
          jti: 'mock-uuid-from-createCallback',
        })
      );
      expect(resultToken.jti).not.toBe('old-jti');
    });

    it('returned callback should return minimal token with new JTI if validation fails', async () => {
      mockValidateInputsCallback.mockReturnValue({ isValid: false });
      const testSUTDependencies = createCallbackDeps();
      const initialToken: JWT = { sub: 'existing-sub', jti: 'old-jti' };

      const signInCallback = oauthHelpersModuleActual.createOAuthSignInCallback({
        jwt: initialToken,
        token: initialToken,
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: 'callback-fail-correlation',
        dependencies: testSUTDependencies,
      });
      const resultToken = await signInCallback();

      expect(prepareProfileMock).not.toHaveBeenCalled();
      expect(findOrCreateUserMock).not.toHaveBeenCalled();
      // Restore full check for minimal token with new JTI
      // expect(resultToken.jti).toBe('mock-uuid-from-createCallback'); // This was the simplified check
      expect(resultToken).toEqual({
        jti: 'mock-uuid-from-createCallback',
      });
      expect(resultToken.sub).toBeUndefined(); // Check this separately if JTI passes
    });
  });
});
