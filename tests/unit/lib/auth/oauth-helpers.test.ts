/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { UserRole } from '@/types';
import { Account, Profile, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
// import { v4 as uuidv4_actual } from 'uuid'; // Removed unused
// import { v4 as uuidv4 } from 'uuid'; // Removed unused, globalMockUuidV4 is used directly
// import { logger as logger_actual } from '@/lib/logger'; // Removed unused logger_actual
// import { v4 as uuidv4 } from 'uuid'; // Import the mocked v4
import { defaultDependencies as actualDefaultDependencies } from '@/lib/auth/auth-jwt-types';
import { validateSignInInputs as actualValidateSignInInputs } from '@/lib/auth/auth-helpers';

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

// Mock uuid - this will use our lib/__mocks__/uuid.ts file
jest.mock('uuid');

// Mock auth-helpers (for dependencies like validateSignInInputs, prepareProfile, findOrCreateUser from defaultDependencies)
jest.mock('@/lib/auth/auth-helpers');

// DO NOT mock '@/lib/auth/oauth-helpers' here; we will import the actual module and spy on its methods.

// Import the actual module to be tested (and spied upon)
import * as oauthHelpersModuleActual from '@/lib/auth/oauth-helpers';
import { defaultDependencies } from '@/lib/auth/auth-jwt-types'; // For type information if needed, and for original dependencies
import type {
  AuthUserInternal,
  // FindOrCreateUserParams, // Might not be needed if using spies
} from '@/lib/auth/auth-helpers';
import type { OAuthDbUser } from '@/lib/auth/auth-jwt-types';

// Define a type for the mocked auth-helpers module (from jest.mock('@/lib/auth/auth-helpers'))
interface MockedAuthHelpers {
  findOrCreateUserAndAccountInternal: jest.MockedFunction<
    typeof defaultDependencies.findOrCreateUser
  >;
  prepareProfileDataForDb: jest.MockedFunction<typeof defaultDependencies.prepareProfile>;
  validateSignInInputs: jest.MockedFunction<typeof defaultDependencies.validateInputs>;
}

// Helper function to get typed mocks from the mocked '@/lib/auth/auth-helpers'
const getMocks = () => {
  const helpersMod = jest.requireMock('@/lib/auth/auth-helpers') as MockedAuthHelpers;
  return {
    // These are from the *mocked* auth-helpers module
    findOrCreateUser: helpersMod.findOrCreateUserAndAccountInternal,
    prepareProfile: helpersMod.prepareProfileDataForDb,
    validateInputs: helpersMod.validateSignInInputs,
  };
};

// Mock data (remains the same)
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

// Re-define MockedDefaultDependencies with correct uuidv4 type
type MockedDefaultDependencies = {
  findOrCreateUser: jest.MockedFunction<typeof actualDefaultDependencies.findOrCreateUser>;
  prepareProfile: jest.MockedFunction<typeof actualDefaultDependencies.prepareProfile>;
  validateInputs: jest.MockedFunction<typeof actualDefaultDependencies.validateInputs>;
  uuidv4: jest.Mock<() => string>; // Correctly typed for our mock
};

interface HandleOAuthTestDependencies {
  validateInputs: jest.MockedFunction<typeof actualValidateSignInInputs>;
  uuidv4: jest.Mock<() => string>; // Correctly typed for our mock
}

// Define the explicit jest.fn() for uuid.v4
const globalMockUuidV4 = jest.fn(() => 'mock-uuid-string-value--global');
jest.mock('uuid', () => ({
  __esModule: true, // Indicate it's an ES module for mocking purposes
  v4: globalMockUuidV4, // Override v4 with our mock. Other exports will be undefined.
}));

describe('OAuth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOAuthInputs (actual implementation)', () => {
    it('should return valid result with all fields present', () => {
      const result = oauthHelpersModuleActual.validateOAuthInputs(
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
      const result = oauthHelpersModuleActual.validateOAuthInputs(
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
      const result = oauthHelpersModuleActual.validateOAuthInputs(
        userWithoutEmail,
        mockAccount,
        mockCorrelationId
      );
      expect(result).toEqual({
        isValid: false,
      });
    });
    it('should return invalid result with missing account', () => {
      const result = oauthHelpersModuleActual.validateOAuthInputs(
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

    // Use MockedDefaultDependencies as return type
    const createDependenciesForSUT = (): MockedDefaultDependencies => ({
      findOrCreateUser: findOrCreateUserMock,
      prepareProfile: prepareProfileMock,
      validateInputs: validateInputsMock,
      uuidv4: globalMockUuidV4, // Use the explicit global mock instance
    });

    beforeEach(() => {
      prepareProfileMock.mockReset();
      findOrCreateUserMock.mockReset();
      validateInputsMock.mockReset(); // Though not directly used by SUT, good practice

      // Default mock implementations for dependencies of the SUT's internal functions
      prepareProfileMock.mockReturnValue({
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      });
      // findOrCreateUserMock is the dependency for the *actual* performDbFindOrCreateUser
      findOrCreateUserMock.mockResolvedValue(mockAuthUserInternal);
    });

    it('should correctly find or create a user and transform to OAuthDbUser on valid inputs', async () => {
      const testSUTDependencies = createDependenciesForSUT();

      const specificProfileData = {
        id: 'prepared-profile-id',
        email: mockUser.email as string,
        name: 'Prepared Name',
        image: 'prepared.jpg',
      };
      prepareProfileMock.mockReturnValue(specificProfileData);

      const dbAuthUser: AuthUserInternal = {
        id: 'final-db-id',
        email: mockUser.email as string,
        name: 'Final DB Name',
        image: 'final_db.jpg',
        role: UserRole.ADMIN,
      };
      findOrCreateUserMock.mockResolvedValue(dbAuthUser); // Dependency of performDbFindOrCreateUser

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser, // For validateOAuthInputs to pass
        account: mockAccount, // For validateOAuthInputs to pass
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(prepareProfileMock).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email as string,
        mockProfile,
        mockUser
      );
      // Check that findOrCreateUser (dependency of performDbFindOrCreateUser) was called correctly
      expect(findOrCreateUserMock).toHaveBeenCalledWith({
        email: mockUser.email as string,
        profileData: specificProfileData, // from prepareProfileMock
        providerAccountId: mockAccount.providerAccountId,
        provider: mockAccount.provider,
        correlationId: mockCorrelationId,
      });

      // Expect the transformed result
      expect(result).toEqual<OAuthDbUser>({
        userId: dbAuthUser.id,
        userEmail: dbAuthUser.email as string,
        name: dbAuthUser.name,
        image: dbAuthUser.image,
        role: dbAuthUser.role,
      });
    });

    it('should return null if internal validateOAuthInputs fails (e.g. no user email)', async () => {
      const userWithoutEmail = { ...mockUser, email: null }; // Makes validateOAuthInputs fail
      const testSUTDependencies = createDependenciesForSUT();

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        // @ts-ignore // Allow null email for testing validation
        user: userWithoutEmail,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(prepareProfileMock).not.toHaveBeenCalled();
      expect(findOrCreateUserMock).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if internal performDbFindOrCreateUser returns null (e.g., findOrCreateUser dependency fails)', async () => {
      findOrCreateUserMock.mockResolvedValue(null); // Dependency of performDbFindOrCreateUser returns null
      const testSUTDependencies = createDependenciesForSUT();

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(prepareProfileMock).toHaveBeenCalledTimes(1);
      expect(findOrCreateUserMock).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should return null if internal performDbFindOrCreateUser throws (e.g., findOrCreateUser dependency throws)', async () => {
      findOrCreateUserMock.mockRejectedValue(new Error('DB error from findOrCreateUser mock'));
      const testSUTDependencies = createDependenciesForSUT();

      const result = await oauthHelpersModuleActual.findOrCreateOAuthDbUser({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        correlationId: mockCorrelationId,
        dependencies: testSUTDependencies,
      });

      expect(prepareProfileMock).toHaveBeenCalledTimes(1);
      expect(findOrCreateUserMock).toHaveBeenCalledTimes(1); // It was called and then threw
      expect(result).toBeNull(); // SUT should catch the error and return null
    });
  });

  describe('handleOAuthSignIn (actual implementation)', () => {
    const { validateInputs: validateInputsMockFromAuthHelpers } = getMocks();

    const createHandleSignInDeps = (): HandleOAuthTestDependencies => ({
      validateInputs: validateInputsMockFromAuthHelpers,
      uuidv4: globalMockUuidV4, // Use the explicit global mock instance
    });

    beforeEach(() => {
      validateInputsMockFromAuthHelpers.mockReset();
    });

    it('should handle successful OAuth sign in', async () => {
      validateInputsMockFromAuthHelpers.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email as string,
      });
      const testDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        isNewUser: false,
        correlationId: mockCorrelationId,
        dependencies: testDependencies,
      });
      expect(testDependencies.validateInputs).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return false if validation fails', async () => {
      validateInputsMockFromAuthHelpers.mockReturnValue({
        isValid: false,
      });
      const testDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        isNewUser: false,
        correlationId: mockCorrelationId,
        dependencies: testDependencies,
      });
      expect(testDependencies.validateInputs).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    it('should handle sign-in errors', async () => {
      validateInputsMockFromAuthHelpers.mockImplementation(() => {
        throw new Error('Validation error');
      });
      const testDependencies = createHandleSignInDeps();

      const result = await oauthHelpersModuleActual.handleOAuthSignIn({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        isNewUser: false,
        correlationId: mockCorrelationId,
        dependencies: testDependencies,
      });
      expect(testDependencies.validateInputs).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });

  describe('createOAuthSignInCallback (actual implementation)', () => {
    const { validateInputs: validateInputsMockFromAuthHelpersForCallback } = getMocks();

    const createCallbackDeps = (): HandleOAuthTestDependencies => ({
      validateInputs: validateInputsMockFromAuthHelpersForCallback,
      uuidv4: globalMockUuidV4, // Use the explicit global mock instance
    });

    beforeEach(() => {
      validateInputsMockFromAuthHelpersForCallback.mockReset();
    });

    it('should create a function that handles OAuth sign in', async () => {
      const mockJwtData: JWT = {
        sub: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/avatar.jpg',
      };
      validateInputsMockFromAuthHelpersForCallback.mockReturnValue({
        isValid: true,
        userId: mockUser.id,
        userEmail: mockUser.email as string,
      });
      const testDependencies = createCallbackDeps();

      const signInCallback = oauthHelpersModuleActual.createOAuthSignInCallback({
        jwt: mockJwtData,
        token: { ...mockJwtData },
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
        isNewUser: false,
        dependencies: testDependencies,
      });

      expect(typeof signInCallback).toBe('function');
      const result = await signInCallback();
      expect(result).toEqual({ ...mockJwtData });
      expect(testDependencies.validateInputs).toHaveBeenCalled();
    });
  });
});
