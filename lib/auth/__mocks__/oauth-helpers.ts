import { UserRole } from '@/types';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from 'next-auth/adapters';
import type { Account, Profile, User as NextAuthUser } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { OAuthDbUser } from './auth-jwt-types';

interface MockDependencies {
  prepareProfile?: (
    userId: string,
    userEmail: string,
    profile: Profile,
    user: NextAuthUser | AdapterUser
  ) => MockPreparedProfile;
  findOrCreateUser?: (params: {
    email: string;
    profileData: MockPreparedProfile;
    providerAccountId: string;
    provider: string;
    correlationId: string;
  }) => Promise<OAuthDbUser | null>;
  validateInputs?: (
    user: NextAuthUser | AdapterUser | null | undefined,
    account: Account | null | undefined,
    correlationId: string
  ) => { isValid: boolean; userId?: string; userEmail?: string };
}

type MockPreparedProfile = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

interface HandleFindOrCreateUserOptions {
  userEmail: string;
  preparedProfileData: MockPreparedProfile;
  account: Account;
  correlationId: string;
}

const _handleFindOrCreateUserViaDependencies = async (
  options: HandleFindOrCreateUserOptions,
  dependencies: MockDependencies
): Promise<OAuthDbUser | null> => {
  if (!dependencies.findOrCreateUser) {
    return null;
  }
  const dbUserFromDep = await dependencies.findOrCreateUser({
    email: options.userEmail,
    profileData: options.preparedProfileData,
    providerAccountId: options.account.providerAccountId,
    provider: options.account.provider,
    correlationId: options.correlationId,
  });
  if (!dbUserFromDep) return null;
  return {
    userId: dbUserFromDep.userId,
    userEmail: dbUserFromDep.userEmail,
    name: dbUserFromDep.name,
    image: dbUserFromDep.image,
    role: dbUserFromDep.role || UserRole.USER,
  };
};

// Directly mock the actual validateOAuthInputs from the module we are mocking
export const validateOAuthInputs = jest
  .fn()
  .mockImplementation(
    (
      user: NextAuthUser | AdapterUser | null | undefined,
      account: Account | null | undefined,
      _correlationId: string
    ) => {
      // Default mock behavior, can be overridden in tests
      return {
        isValid: !!(user?.id && user?.email && account),
        userId: user?.id,
        userEmail: user?.email,
      };
    }
  );

/**
 * Mock implementation for findOrCreateOAuthDbUser
 */
export const findOrCreateOAuthDbUser = jest
  .fn()
  .mockImplementation(
    async (params: {
      user: NextAuthUser | AdapterUser;
      account: Account;
      profile?: Profile;
      correlationId: string;
      dependencies?: MockDependencies;
    }): Promise<OAuthDbUser | null> => {
      const validationResult = validateOAuthInputs(
        params.user,
        params.account,
        params.correlationId
      );

      if (!validationResult.isValid) {
        return null;
      }

      const { userId, userEmail } = validationResult as { userId: string; userEmail: string };

      let preparedProfileData: MockPreparedProfile = {
        id: userId,
        email: userEmail,
        name: params.user.name,
        image: params.user.image,
      };
      if (params.profile && params.dependencies?.prepareProfile) {
        // Assuming prepareProfile returns something compatible with MockPreparedProfile or any for the mock
        preparedProfileData = params.dependencies.prepareProfile(
          userId,
          userEmail,
          params.profile,
          params.user
        );
      }

      if (params.dependencies?.findOrCreateUser) {
        return _handleFindOrCreateUserViaDependencies(
          {
            userEmail,
            preparedProfileData,
            account: params.account,
            correlationId: params.correlationId,
          },
          params.dependencies
        );
      }

      return {
        userId: userId || 'mock-user-id',
        userEmail: userEmail || 'mock@example.com',
        name: params.user.name,
        image: params.user.image,
        role: UserRole.USER,
      };
    }
  );

/**
 * Mock implementation for handleOAuthSignIn
 */
export const handleOAuthSignIn = jest
  .fn()
  .mockImplementation(
    async (params: {
      user: NextAuthUser | AdapterUser;
      account: Account;
      profile: Profile;
      isNewUser?: boolean;
      correlationId?: string;
      dependencies?: MockDependencies;
    }): Promise<boolean> => {
      if (params.dependencies?.validateInputs) {
        const validationResult = params.dependencies.validateInputs(
          params.user,
          params.account,
          params.correlationId || 'default-correlation-id'
        );
        return validationResult.isValid;
      }
      // Fallback, if no specific validation dependency is provided/tested
      const mainValidation = validateOAuthInputs(
        params.user,
        params.account,
        params.correlationId || 'default-correlation-id'
      );
      return mainValidation.isValid;
    }
  );

/**
 * Mock implementation for createOAuthSignInCallback
 */
export const createOAuthSignInCallback = jest
  .fn()
  .mockImplementation(
    (params: {
      jwt: JWT;
      token: JWT;
      user: NextAuthUser | AdapterUser;
      account: Account | null;
      profile?: Profile;
      isNewUser?: boolean;
      correlationId?: string;
      dependencies?: MockDependencies;
    }) => {
      return async () => {
        if (params.dependencies?.validateInputs && params.account) {
          params.dependencies.validateInputs(
            params.user,
            params.account,
            params.correlationId || 'default-correlation-id'
          );
        }
        return { ...params.token };
      };
    }
  );

// Mock other helper functions from the original oauth-helpers.ts if they are exported and used by other modules
export const validateOAuthSignInInputs = jest.fn().mockImplementation(() => ({ isValid: true }));

export const validateOAuthRequestInputs = jest
  .fn()
  .mockImplementation(() => ({ isValid: true, validAccount: {} as Account }));

export const createFallbackToken = jest
  .fn()
  .mockImplementation((_baseToken: JWT) => ({ jti: uuidv4() }));

export const createOAuthJwtPayload = jest
  .fn()
  .mockImplementation(
    (payloadParams: {
      _baseToken: JWT;
      dbUser: OAuthDbUser;
      provider: string;
      correlationId: string;
    }) => {
      return {
        sub: payloadParams.dbUser.userId,
        name: payloadParams.dbUser.name,
        email: payloadParams.dbUser.userEmail,
        picture: payloadParams.dbUser.image,
        role: payloadParams.dbUser.role || UserRole.USER,
        jti: uuidv4(),
        userId: payloadParams.dbUser.userId,
        userRole: payloadParams.dbUser.role || UserRole.USER,
      };
    }
  );

export const performDbFindOrCreateUser = jest.fn().mockImplementation(async () => {
  return {
    userId: 'mock-db-user-id',
    userEmail: 'mockdb@example.com',
    name: 'Mock DB User',
    image: 'https://example.com/avatar_db.jpg',
    role: UserRole.USER,
  };
});
