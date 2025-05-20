import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
// import { v4 as uuidv4 } from 'uuid'; // Unused import
import {
  findOrCreateUserAndAccountInternal,
  FindOrCreateUserParams,
  validateSignInInputs,
  prepareProfileDataForDb,
} from '@/lib/auth/auth-helpers';
import { UserRole } from '@/types';
import type { User as PrismaUserType } from '@prisma/client';
import type { AdapterUser } from 'next-auth/adapters';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async callback => callback(prisma)), // Mock transaction if needed
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-test-helper'),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(), // Simple mock for chaining if needed
  },
  // Mock named loggers if necessary
}));

describe('Auth Helpers', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUserAndAccountInternal', () => {
    const mockCorrelationId = 'test-corr-id-123';
    const mockProvider = 'google';
    const mockProviderAccountId = 'google-user-id-456';
    const mockEmail = 'test@example.com';
    const mockProfileData = {
      id: 'user-profile-id-789', // Often provider ID or generated
      name: 'Test User',
      email: mockEmail,
      image: 'test-image.png',
    };

    const params: FindOrCreateUserParams = {
      email: mockEmail,
      profileData: mockProfileData,
      provider: mockProvider,
      providerAccountId: mockProviderAccountId,
      correlationId: mockCorrelationId,
    };

    // --- Test Cases ---

    it('should return existing user and link account if user exists but account does not', async () => {
      const existingDbUser: PrismaUserType & {
        accounts: { provider: string; providerAccountId: string }[];
      } = {
        id: 'existing-user-id-abc',
        name: 'Existing User',
        email: mockEmail,
        emailVerified: null,
        image: 'existing-image.png',
        hashedPassword: null,
        role: 'USER', // Prisma enum value
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedInAt: null,
        accounts: [], // No existing account for this provider
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingDbUser);
      (prisma.account.create as jest.Mock).mockResolvedValue({}); // Simulate successful account creation

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          accounts: { select: { provider: true, providerAccountId: true } },
        },
      });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          userId: existingDbUser.id,
          type: 'oauth',
          provider: mockProvider,
          providerAccountId: mockProviderAccountId,
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled(); // Should not create a new user
      expect(result).toEqual({
        id: existingDbUser.id,
        name: existingDbUser.name,
        email: existingDbUser.email,
        image: existingDbUser.image,
        role: UserRole.USER, // Ensure internal enum value
      });

      // Verify logger.info calls in order
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          userId: existingDbUser.id,
          email: mockEmail,
          provider: mockProvider,
          correlationId: params.correlationId,
        }),
        '[findOrCreateUserAndAccountInternal] User found, handling existing user account linking.'
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          userId: existingDbUser.id,
          email: mockEmail,
          provider: mockProvider,
          providerAccountId: mockProviderAccountId,
          correlationId: params.correlationId,
        }),
        '[_handleExistingUser] Account not found for this provider. Attempting to link.'
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          userId: existingDbUser.id,
          provider: mockProvider,
          correlationId: params.correlationId,
        }),
        '[_createAccountForExistingUser] Adding new provider account'
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          userId: existingDbUser.id,
          email: mockEmail,
          provider: mockProvider,
          providerAccountId: mockProviderAccountId,
          correlationId: params.correlationId,
        }),
        '[_handleExistingUser] Successfully linked new account.'
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        5,
        expect.objectContaining({
          userId: existingDbUser.id,
          email: mockEmail,
          provider: mockProvider,
          providerAccountId: mockProviderAccountId,
          correlationId: params.correlationId,
        }),
        '[_handleExistingUser] Successfully processed existing user.'
      );
    });

    it('should return existing user if user and account already exist', async () => {
      const existingUserAndAccount = {
        id: 'existing-user-id-def',
        name: 'Fully Existing User',
        email: mockEmail,
        emailVerified: new Date(),
        image: 'full-existing-image.png',
        hashedPassword: null,
        role: 'ADMIN' as UserRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedInAt: null,
        accounts: [{ provider: mockProvider, providerAccountId: mockProviderAccountId }],
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUserAndAccount);

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(result?.id).toBe(existingUserAndAccount.id);
      expect(prisma.account.create).not.toHaveBeenCalled(); // Corrected: Should NOT be called if account exists

      // Specific log calls in order
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          userId: existingUserAndAccount.id,
          email: mockEmail,
          provider: params.provider,
          correlationId: params.correlationId,
        }),
        '[findOrCreateUserAndAccountInternal] User found, handling existing user account linking.'
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          userId: existingUserAndAccount.id,
          email: mockEmail,
          provider: params.provider,
          providerAccountId: mockProviderAccountId,
          correlationId: params.correlationId,
        }),
        '[_handleExistingUser] Successfully processed existing user.'
      );
    });

    it('should create and return a new user if user does not exist', async () => {
      const newUserDbResult = {
        // What prisma.user.create would return (based on select)
        id: mockProfileData.id,
        name: mockProfileData.name,
        email: mockProfileData.email,
        image: mockProfileData.image,
        role: 'USER', // Prisma enum value
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User not found
      (prisma.user.create as jest.Mock).mockResolvedValue(newUserDbResult); // Simulate successful user/account creation

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          accounts: { select: { provider: true, providerAccountId: true } },
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: mockProfileData.id,
          email: mockEmail,
          name: mockProfileData.name,
          image: mockProfileData.image,
          role: 'USER',
          accounts: {
            create: {
              type: 'oauth',
              provider: mockProvider,
              providerAccountId: mockProviderAccountId,
            },
          },
        },
        select: { id: true, name: true, email: true, image: true, role: true },
      });
      expect(prisma.account.create).not.toHaveBeenCalled(); // Account created via nested write
      expect(result).toEqual({
        id: newUserDbResult.id,
        name: newUserDbResult.name,
        email: newUserDbResult.email,
        image: newUserDbResult.image,
        role: UserRole.USER, // Ensure internal enum value
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ email: mockEmail, provider: mockProvider }),
        '[findOrCreateUserAndAccountInternal] User not found, creating new user and account.'
      );
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should return null if user lookup fails', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.account.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({ message: dbError.message }),
        }),
        '[findOrCreateUserAndAccountInternal] Error during find or create user/account process'
      );
    });

    it('should return null if new user creation fails', async () => {
      const dbCreateError = new Error('Failed to create user in DB');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User not found
      (prisma.user.create as jest.Mock).mockRejectedValue(dbCreateError); // Creation fails

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.account.create).not.toHaveBeenCalled();
      // First error log (from helper)
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: dbCreateError,
          email: mockEmail,
          provider: mockProvider,
          correlationId: params.correlationId,
        }),
        '[_createNewUserWithAccount] Failed to create user/account'
      );

      // Second error log (from main function)
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockEmail,
          provider: mockProvider,
          correlationId: params.correlationId,
        }),
        '[_createNewUserWithAccount] Failed to create user/account'
      );
    });

    it('should return null if linking account to existing user fails', async () => {
      const linkError = new Error('Failed to link account');
      const existingDbUser: PrismaUserType & {
        accounts: { provider: string; providerAccountId: string }[];
      } = {
        id: 'existing-user-id-abc',
        name: 'Existing User',
        email: mockEmail,
        emailVerified: null,
        image: 'existing-image.png',
        hashedPassword: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedInAt: null,
        accounts: [], // No existing account for this provider
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingDbUser);
      (prisma.account.create as jest.Mock).mockRejectedValue(linkError); // Account linking fails

      let result;
      try {
        result = await findOrCreateUserAndAccountInternal(params);
        expect(result).toBeNull(); // Should return null as error is handled internally by _handleExistingUser
      } catch (e) {
        // This block should not be reached
        expect(e).toBeUndefined();
      }

      // Verify logger calls:
      // 1. From _createAccountForExistingUser (which re-throws)
      // 2. From _handleExistingUser (which catches the re-thrown error and returns null)
      expect(logger.error).toHaveBeenCalledTimes(2);

      // Check the first error log (from _createAccountForExistingUser)
      expect(logger.error).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          err: linkError,
          userId: existingDbUser.id,
          provider: params.provider,
          correlationId: params.correlationId,
        }),
        '[_createAccountForExistingUser] Failed to add account'
      );

      // Check the second error log (from _handleExistingUser)
      expect(logger.error).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          err: linkError, // The original error, caught by _handleExistingUser
          userId: existingDbUser.id,
          email: mockEmail,
          provider: params.provider,
          providerAccountId: params.providerAccountId,
          correlationId: params.correlationId,
        }),
        '[_handleExistingUser] Error during _createAccountForExistingUser. Returning null.'
      );
    });

    // TODO: Add tests for validateSignInInputs
    // TODO: Add tests for prepareProfileDataForDb
  });

  describe('validateSignInInputs', () => {
    const correlationId = 'validate-corr-id';

    it('should return isValid: true with userId and userEmail for valid inputs', () => {
      const user: AdapterUser = {
        id: 'user1',
        email: 'valid@example.com',
        emailVerified: null,
        role: UserRole.USER,
      };
      const account = { provider: 'google', providerAccountId: 'google123' };
      const result = validateSignInInputs(user, account, correlationId);
      expect(result).toEqual({ isValid: true, userId: 'user1', userEmail: 'valid@example.com' });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should return isValid: false if user is missing', () => {
      const account = { provider: 'google', providerAccountId: 'google123' };
      const result = validateSignInInputs(null, account, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing user ID or email during sign-in',
        })
      );
    });

    it('should return isValid: false if user id is missing', () => {
      const user: AdapterUser = {
        id: '',
        email: 'valid@example.com',
        emailVerified: null,
        role: UserRole.USER,
      };
      const account = { provider: 'google', providerAccountId: 'google123' };
      const result = validateSignInInputs(user, account, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing user ID or email during sign-in',
        })
      );
    });

    it('should return isValid: false if user email is missing', () => {
      const user: AdapterUser = {
        id: 'user1',
        email: undefined as any,
        emailVerified: null,
        role: UserRole.USER,
      };
      const account = { provider: 'google', providerAccountId: 'google123' };
      const result = validateSignInInputs(user, account, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing user ID or email during sign-in',
        })
      );
    });

    it('should return isValid: false if account is missing', () => {
      const user: AdapterUser = {
        id: 'user1',
        email: 'valid@example.com',
        emailVerified: null,
        role: UserRole.USER,
      };
      const result = validateSignInInputs(user, null, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing account provider or providerAccountId',
        })
      );
    });

    it('should return isValid: false if account provider is missing', () => {
      const user: AdapterUser = {
        id: 'user1',
        email: 'valid@example.com',
        emailVerified: null,
        role: UserRole.USER,
      };
      const account = { provider: '', providerAccountId: 'google123' };
      const result = validateSignInInputs(user, account, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing account provider or providerAccountId',
        })
      );
    });

    it('should return isValid: false if account providerAccountId is missing', () => {
      const user: AdapterUser = {
        id: 'user1',
        email: 'valid@example.com',
        emailVerified: null,
        role: UserRole.USER,
      };
      const account = { provider: 'google', providerAccountId: '' };
      const result = validateSignInInputs(user, account, correlationId);
      expect(result).toEqual({ isValid: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Missing account provider or providerAccountId',
        })
      );
    });
  });

  describe('prepareProfileDataForDb', () => {
    const userId = 'user-db-id';
    const userEmail = 'user@db.com';

    it('should prioritize profile data when available', () => {
      const profile = {
        id: 'profile-id',
        name: 'Profile Name',
        email: 'profile@email.com', // Should be ignored
        image: 'profile-image.png',
      };
      const user: AdapterUser = {
        id: 'user-auth-id',
        name: 'User Name',
        email: 'user@auth.com',
        image: 'user-image.png',
        emailVerified: null,
        role: UserRole.USER,
      };

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId, // Always use the passed userId
        name: 'Profile Name',
        email: userEmail, // Always use the passed userEmail
        image: 'profile-image.png',
      });
    });

    it('should use user data as fallback when profile data is missing fields', () => {
      const profile = {
        // Missing name and image
        id: 'profile-id',
        email: 'profile@email.com',
      };
      const user: AdapterUser = {
        id: 'user-auth-id',
        name: 'User Name',
        email: 'user@auth.com',
        image: 'user-image.png',
        emailVerified: null,
        role: UserRole.USER,
      };

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId,
        name: 'User Name', // Fallback from user
        email: userEmail,
        image: 'user-image.png', // Fallback from user
      });
    });

    it('should handle null profile gracefully and use user data', () => {
      const profile = null;
      const user: AdapterUser = {
        id: 'user-auth-id',
        name: 'User Name Only',
        email: 'user@auth.com',
        image: null,
        emailVerified: null,
        role: UserRole.USER,
      };

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId,
        name: 'User Name Only',
        email: userEmail,
        image: null,
      });
    });

    it('should handle null user gracefully and use profile data', () => {
      const profile = {
        id: 'profile-id',
        name: 'Profile Name Only',
        email: 'profile@email.com',
        image: 'profile-image.png',
      };
      const user = null;

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId,
        name: 'Profile Name Only',
        email: userEmail,
        image: 'profile-image.png',
      });
    });

    it('should handle both profile and user being null/undefined', () => {
      const profile = undefined;
      const user = null;

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId,
        name: null, // Fallback to null
        email: userEmail,
        image: null, // Fallback to null
      });
    });

    it('should handle profile and user having null/undefined fields', () => {
      const profile = {
        id: 'profile-id',
        name: undefined,
        email: 'profile@email.com',
        image: null,
      };
      const user: AdapterUser = {
        id: 'user-auth-id',
        name: null,
        email: 'user@auth.com',
        image: undefined,
        emailVerified: null,
        role: UserRole.USER,
      };

      const result = prepareProfileDataForDb(userId, userEmail, profile, user);
      expect(result).toEqual({
        id: userId,
        name: null, // Falls back through undefined and null
        email: userEmail,
        image: null, // Falls back through null and undefined
      });
    });
  });
});
