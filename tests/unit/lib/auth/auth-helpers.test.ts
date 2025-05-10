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
        include: { accounts: { select: { provider: true, providerAccountId: true } } },
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
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId: existingDbUser.id, provider: mockProvider }),
        '[_handleExistingUser] Account does not exist, creating...'
      );
    });

    it('should return existing user if user and account already exist', async () => {
      const existingDbUser: PrismaUserType & {
        accounts: { provider: string; providerAccountId: string }[];
      } = {
        id: 'existing-user-id-def',
        name: 'Fully Existing User',
        email: mockEmail,
        emailVerified: null,
        image: 'full-existing-image.png',
        hashedPassword: null,
        role: 'ADMIN', // Prisma enum value
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedInAt: null,
        accounts: [{ provider: mockProvider, providerAccountId: mockProviderAccountId }], // Account exists
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingDbUser);

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        include: { accounts: { select: { provider: true, providerAccountId: true } } },
      });
      expect(prisma.account.create).not.toHaveBeenCalled(); // Should not create account
      expect(prisma.user.create).not.toHaveBeenCalled(); // Should not create user
      expect(result).toEqual({
        id: existingDbUser.id,
        name: existingDbUser.name,
        email: existingDbUser.email,
        image: existingDbUser.image,
        role: UserRole.ADMIN, // Ensure internal enum value matches
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId: existingDbUser.id, provider: mockProvider }),
        '[_handleExistingUser] Account already exists'
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
        include: { accounts: { select: { provider: true, providerAccountId: true } } },
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
        '[findOrCreateUserInternal] User not found, attempting creation...'
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId: newUserDbResult.id }),
        '[_createNewUserWithAccount] New user and account created successfully'
      );
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
          msg: '[findOrCreateUserInternal] Error during find/create process',
          error: expect.objectContaining({ message: dbError.message }),
        })
      );
    });

    it('should return null if new user creation fails', async () => {
      const creationError = new Error('Failed to create user in DB');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User not found
      (prisma.user.create as jest.Mock).mockRejectedValue(creationError); // Creation fails

      const result = await findOrCreateUserAndAccountInternal(params);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.account.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: creationError }),
        '[_createNewUserWithAccount] Failed to create user/account'
      );
      // Check the second call to logger.error for the outer message
      expect(logger.error).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          email: mockEmail,
          provider: mockProvider,
          correlationId: mockCorrelationId,
        }),
        '[findOrCreateUserInternal] Failed to find or create user.'
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
        accounts: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingDbUser);
      (prisma.account.create as jest.Mock).mockRejectedValue(linkError); // Account linking fails

      // We expect the error to be caught within _createAccountForExistingUser and rethrown,
      // then caught by the outer try/catch in findOrCreateUserAndAccountInternal
      const result = await findOrCreateUserAndAccountInternal(params);

      expect(result).toBeNull(); // Should return null because the process failed
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.account.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: linkError }),
        '[_createAccountForExistingUser] Failed to add account'
      );
      // Check the second call to logger.error for the outer message
      expect(logger.error).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          email: mockEmail,
          provider: mockProvider,
          correlationId: mockCorrelationId,
          msg: '[findOrCreateUserInternal] Error during find/create process',
          error: expect.objectContaining({ message: linkError.message }),
        })
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
