import {
  validateOAuthInputs,
  validateOAuthSignInInputs,
  createFallbackToken,
  validateOAuthRequestInputs,
} from '@/lib/auth/oauth-validation-helpers';
import { logger } from '@/lib/logger';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type User as NextAuthUser } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import { validateSignInInputs } from '@/lib/auth/auth-helpers'; // Mock this
// import { defaultDependencies } from '@/lib/auth/auth-jwt-types'; // For uuidv4 - uuidv4 is mocked directly

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/auth/auth-helpers', () => ({
  validateSignInInputs: jest.fn(),
}));

const mockUuidv4 = jest.fn();
const mockValidateSignInInputs = validateSignInInputs as jest.Mock;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockUuidv4.mockReturnValue('mock-jti'); // Default mock value
});

const sampleUser: NextAuthUser | AdapterUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: null,
  role: 'USER', // Added default role for AdapterUser compatibility
};

const googleProvider: Lowercase<string> = 'google';

const sampleAccount: Account = {
  provider: googleProvider,
  type: 'oauth',
  providerAccountId: 'google-account-id',
  access_token: 'access-token',
  expires_at: Date.now() + 3600,
  token_type: 'bearer',
  scope: 'openid email profile',
  id_token: 'id-token',
  userId: 'user-123',
};

const sampleCorrelationId = 'corr-id-123';
const sampleBaseToken: JWT = { name: 'Test Token' };

describe('lib/auth/oauth-validation-helpers', () => {
  describe('validateOAuthInputs', () => {
    it('should return isValid: true with userId and userEmail when inputs are valid', () => {
      const result = validateOAuthInputs(sampleUser, sampleAccount, sampleCorrelationId);
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe(sampleUser.id);
      expect(result.userEmail).toBe(sampleUser.email);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return isValid: false and log error if user is null', () => {
      const result = validateOAuthInputs(null, sampleAccount, sampleCorrelationId);
      expect(result.isValid).toBe(false);
      expect(result.userId).toBeUndefined();
      expect(result.userEmail).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: sampleCorrelationId,
          userId: undefined,
          userEmail: undefined,
          accountId: sampleAccount.providerAccountId,
          provider: sampleAccount.provider,
          msg: 'User ID, email, or account is missing, cannot proceed with findOrCreateUser.',
        })
      );
    });

    it('should return isValid: false and log error if user.id is missing', () => {
      const userMissingId = { ...sampleUser, id: undefined } as unknown as AdapterUser;
      const result = validateOAuthInputs(userMissingId, sampleAccount, sampleCorrelationId);
      expect(result.isValid).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return isValid: false and log error if user.email is missing', () => {
      const userMissingEmail = { ...sampleUser, email: undefined } as unknown as AdapterUser;
      const result = validateOAuthInputs(userMissingEmail, sampleAccount, sampleCorrelationId);
      expect(result.isValid).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return isValid: false and log error if account is null', () => {
      const result = validateOAuthInputs(sampleUser, null, sampleCorrelationId);
      expect(result.isValid).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: sampleCorrelationId,
          userId: sampleUser.id,
          userEmail: sampleUser.email,
          accountId: undefined,
          provider: undefined,
          msg: 'User ID, email, or account is missing, cannot proceed with findOrCreateUser.',
        })
      );
    });
  });

  describe('validateOAuthSignInInputs', () => {
    const dependencies = {
      validateInputs: mockValidateSignInInputs,
      uuidv4: mockUuidv4,
    };

    it('should return isValid: true when account is valid and validateInputs returns true', () => {
      mockValidateSignInInputs.mockReturnValue({ isValid: true });
      const result = validateOAuthSignInInputs(
        sampleUser,
        sampleAccount,
        sampleCorrelationId,
        dependencies
      );
      expect(result.isValid).toBe(true);
      expect(result.errorToken).toBeUndefined();
      expect(mockValidateSignInInputs).toHaveBeenCalledWith(
        sampleUser,
        sampleAccount,
        sampleCorrelationId
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return isValid: false and errorToken if account is null', () => {
      const result = validateOAuthSignInInputs(sampleUser, null, sampleCorrelationId, dependencies);
      expect(result.isValid).toBe(false);
      expect(result.errorToken).toEqual({ jti: 'mock-jti' });
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        { correlationId: sampleCorrelationId },
        'Cannot process OAuth sign-in with null account'
      );
      expect(mockValidateSignInInputs).not.toHaveBeenCalled();
    });

    it('should return isValid: false and errorToken if validateInputs returns false', () => {
      mockValidateSignInInputs.mockReturnValue({ isValid: false });
      const result = validateOAuthSignInInputs(
        sampleUser,
        sampleAccount,
        sampleCorrelationId,
        dependencies
      );
      expect(result.isValid).toBe(false);
      expect(result.errorToken).toEqual({ jti: 'mock-jti' });
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        { correlationId: sampleCorrelationId, provider: sampleAccount.provider },
        'Failed JWT OAuth validation'
      );
    });
  });

  describe('createFallbackToken', () => {
    it('should return a token with a new JTI', () => {
      const jtiGenerator = jest.fn().mockReturnValue('new-generated-jti');
      const baseToken: JWT = { name: 'Some Token', sub: 'user-sub' };
      const fallbackToken = createFallbackToken(baseToken, jtiGenerator);
      expect(fallbackToken).toEqual({ jti: 'new-generated-jti' });
      expect(jtiGenerator).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateOAuthRequestInputs', () => {
    const dependencies = {
      validateInputs: mockValidateSignInInputs,
      uuidv4: mockUuidv4,
    };

    it('should return isValid: true and validAccount when inputs are valid', () => {
      mockValidateSignInInputs.mockReturnValue({ isValid: true });
      const params = {
        user: sampleUser,
        account: sampleAccount,
        correlationId: sampleCorrelationId,
        _baseToken: sampleBaseToken,
        dependencies,
      };
      const result = validateOAuthRequestInputs(params);
      expect(result.isValid).toBe(true);
      expect(result.validAccount).toBe(sampleAccount);
      expect(result.fallbackToken).toBeUndefined();
      expect(mockValidateSignInInputs).toHaveBeenCalledWith(
        sampleUser,
        sampleAccount,
        sampleCorrelationId
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return isValid: false and fallbackToken if account is null', () => {
      const params = {
        user: sampleUser,
        account: null,
        correlationId: sampleCorrelationId,
        _baseToken: sampleBaseToken,
        dependencies,
      };
      const result = validateOAuthRequestInputs(params);
      expect(result.isValid).toBe(false);
      expect(result.validAccount).toBeUndefined();
      expect(result.fallbackToken).toEqual({ jti: 'mock-jti' });
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        { correlationId: sampleCorrelationId },
        'Cannot process OAuth sign-in with null account'
      );
      expect(mockValidateSignInInputs).not.toHaveBeenCalled();
    });

    it('should return isValid: false and fallbackToken if validateInputs returns false', () => {
      mockValidateSignInInputs.mockReturnValue({ isValid: false });
      const params = {
        user: sampleUser,
        account: sampleAccount,
        correlationId: sampleCorrelationId,
        _baseToken: sampleBaseToken,
        dependencies,
      };
      const result = validateOAuthRequestInputs(params);
      expect(result.isValid).toBe(false);
      expect(result.validAccount).toBeUndefined();
      expect(result.fallbackToken).toEqual({ jti: 'mock-jti' });
      expect(mockUuidv4).toHaveBeenCalledTimes(1); // Called by createFallbackToken
      expect(logger.error).toHaveBeenCalledWith(
        { correlationId: sampleCorrelationId, provider: sampleAccount.provider },
        'Failed JWT OAuth validation'
      );
    });
  });
});
