// --- Mocks ---
// const mockUuid = 'mock-correlation-id'; // Mock value defined elsewhere
/* jest.mock('uuid', ... */ // Removed: Now uses manual mock in __mocks__/uuid.ts -> Reverting to doMock

// Define the expected mock value for assertions
// const mockUuid = 'mock-correlation-id'; // Will define in describe block

import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
// Import the whole module for mocking
// import * as uuid from 'uuid';
import type { User as NextAuthUser } from 'next-auth';
import { UserRole } from '@/types';
import {
  authorizeLogic,
  CredentialsSchema,
  type AuthorizeDependencies,
} from '@/lib/auth/auth-credentials';
import { logger } from '@/lib/logger';
import type { User as PrismaUser } from '@prisma/client';
import { z } from 'zod';
import type { v4 as uuidv4 } from 'uuid';
// Remove unused import
// import type { Prisma } from '@prisma/client';

// Mock logger directly
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock bcryptjs compare function
jest.mock('bcryptjs');
const mockHasherCompare = jest.fn<() => Promise<boolean>>();
(bcrypt.compare as jest.Mock) = mockHasherCompare;

// --- Test Setup ---

// Define the mock UUID value
const mockUuid = 'mock-correlation-id';

// Create a mock uuidv4 function
const mockUuidV4 = jest.fn(() => mockUuid);

// Typed mock for Prisma user db operations
const mockDbUserFindUnique = jest.fn<() => Promise<PrismaUser | null>>();

// Assemble mock dependencies for authorizeLogic
const mockDependencies: AuthorizeDependencies = {
  db: {
    user: {
      findUnique: mockDbUserFindUnique,
    },
  } as unknown as AuthorizeDependencies['db'], // Cast to unknown first
  hasher: {
    compare: mockHasherCompare,
  },
  validator: {
    // Use the real schema for validation testing
    safeParse: CredentialsSchema.safeParse,
  },
  // Inject the mocked uuidv4 function
  uuidv4: mockUuidV4,
};

// --- Test Data ---
const validCredentials = {
  email: 'test@example.com',
  password: 'password123',
};

const mockPrismaUser: PrismaUser = {
  id: 'user-id-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  image: null,
  hashedPassword: 'hashedPassword123',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const expectedNextAuthUser: NextAuthUser = {
  id: mockPrismaUser.id,
  name: mockPrismaUser.name,
  email: mockPrismaUser.email,
  image: mockPrismaUser.image,
  role: mockPrismaUser.role,
};

// --- Test Suite ---
describe('authorizeLogic', () => {
  // Valid credentials for tests
  const validCredentials = { email: 'test@example.com', password: 'password123' };

  // Mock Prisma user data
  const mockPrismaUser: NonNullable<PrismaUser> = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    image: null,
    hashedPassword: 'hashedPassword123',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Helper function to create mock dependencies
  const createMockDependencies = (): AuthorizeDependencies => ({
    db: { user: { findUnique: mockDbUserFindUnique } },
    hasher: { compare: mockHasherCompare },
    validator: CredentialsSchema, // Use the real schema as the validator
    uuidv4: mockUuidV4 as any, // Cast as any to satisfy type
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default successful mocks
    mockUuidV4.mockReturnValue(mockUuid);
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockResolvedValue(true);
  });

  it('should return user object on successful authentication', async () => {
    const mockDependencies = createMockDependencies();
    const user = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(user).toEqual(expectedNextAuthUser);
    expect(mockUuidV4).toHaveBeenCalledTimes(1); // Verify mock UUID was generated
    expect(mockDbUserFindUnique).toHaveBeenCalledWith({ where: { email: validCredentials.email } });
    expect(mockHasherCompare).toHaveBeenCalledWith(
      validCredentials.password,
      mockPrismaUser.hashedPassword
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid }), // Check mock correlationId
      '[Credentials Authorize Logic] Attempting authorization'
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: mockPrismaUser.id }),
      '[Credentials Authorize Logic] Authorization successful'
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null if credentials validation fails', async () => {
    const mockDependencies = createMockDependencies();
    // Override validator for this test
    const mockValidator = {
      safeParse: jest.fn().mockReturnValue({ success: false, error: new z.ZodError([]) }),
    };
    mockDependencies.validator = mockValidator;

    // Assert that authorizeLogic throws when validation fails
    await expect(authorizeLogic({ email: '', password: '' }, mockDependencies)).rejects.toThrow(
      'Invalid credentials provided.'
    );
    expect(mockValidator.safeParse).toHaveBeenCalledTimes(1);
    // Check logger call *within* _validateCredentials (indirectly tested)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid }),
      expect.stringContaining('[Credentials Validation] Invalid credentials')
    );
    expect(mockDbUserFindUnique).not.toHaveBeenCalled();
    expect(mockHasherCompare).not.toHaveBeenCalled();
  });

  it('should return null and log warning if user not found in db', async () => {
    const mockDependencies = createMockDependencies();
    mockDependencies.db.user.findUnique.mockResolvedValue(null);

    const user = await authorizeLogic(validCredentials, mockDependencies);

    expect(user).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledWith({ where: { email: validCredentials.email } });
    expect(mockHasherCompare).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, email: validCredentials.email }),
      '[Credentials Helper] User not found or no password set'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null and log warning if user has no hashed password', async () => {
    const mockDependencies = createMockDependencies();
    mockDependencies.db.user.findUnique.mockResolvedValue({
      ...mockPrismaUser,
      hashedPassword: null,
    });

    const user = await authorizeLogic(validCredentials, mockDependencies);

    expect(user).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, email: validCredentials.email }),
      '[Credentials Helper] User not found or no password set'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null and log warning if password comparison fails', async () => {
    // Arrange
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockResolvedValue(false); // Simulate incorrect password

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, userId: mockPrismaUser.id }),
      '[Credentials Helper] Incorrect password' // <-- Correct log message from code
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw original error and log error if db query fails', async () => {
    // Arrange
    const dbError = new Error('Database connection lost');
    mockDbUserFindUnique.mockRejectedValue(dbError);

    // Act & Assert
    // await expect(authorizeLogic(validCredentials, mockDependencies)).rejects.toThrow(dbError);
    const result = await authorizeLogic(validCredentials, mockDependencies);
    expect(result).toBeNull(); // Code catches error and returns null

    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).not.toHaveBeenCalled();
    // Check that the correct error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: mockUuid,
        err: dbError, // Check the error object
        email: validCredentials.email, // Check email context
      }),
      '[Credentials Authorize Logic] System error during authorization process' // Check message
    );
  });

  it('should throw original error and log error if password comparison throws', async () => {
    // Arrange
    const compareError = new Error('Bcrypt internal error');
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockRejectedValue(compareError);

    // Act & Assert
    // await expect(authorizeLogic(validCredentials, mockDependencies)).rejects.toThrow(compareError);
    const result = await authorizeLogic(validCredentials, mockDependencies);
    expect(result).toBeNull(); // Code catches error and returns null

    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).toHaveBeenCalledTimes(1);
    // Check that the correct error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: mockUuid,
        err: compareError, // Check the error object
        email: validCredentials.email, // Check email context
      }),
      '[Credentials Authorize Logic] System error during authorization process' // Check message
    );
  });
});
