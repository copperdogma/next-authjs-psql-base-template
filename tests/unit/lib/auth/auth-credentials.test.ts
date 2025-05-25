import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { UserRole } from '@/types';
import {
  authorizeLogic,
  CredentialsSchema,
  type AuthorizeDependencies,
} from '@/lib/auth/auth-credentials';
import { logger } from '@/lib/logger';
import { z } from 'zod';

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

// Typed mock for Prisma user db operations - Ensure it's a Jest mock
// Explicitly type the mock implementation
const mockDbUserFindUnique = jest.fn<() => Promise<User | null>>();

// --- Test Data ---
const validCredentials = {
  email: 'test@example.com',
  password: 'password123',
};

const mockPrismaUser: User = {
  id: 'user-id-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  image: null,
  hashedPassword: 'hashedPassword123',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedInAt: null, // Add the new field
};

// Define the expected return type more accurately based on authorizeLogic
const expectedNextAuthUser: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
} = {
  id: mockPrismaUser.id,
  name: mockPrismaUser.name,
  email: mockPrismaUser.email,
  image: mockPrismaUser.image,
  role: mockPrismaUser.role,
};

// --- Test Suite ---
describe('authorizeLogic', () => {
  // Valid credentials for tests - Defined within describe block
  // const validCredentials = { email: 'test@example.com', password: 'password123' };

  // Mock Prisma user data - Defined within describe block
  // const mockPrismaUser: NonNullable<User> = { ... };

  // Helper function to create mock dependencies - Defined within describe block
  const createMockDependencies = (): AuthorizeDependencies => ({
    db: {
      user: { findUnique: mockDbUserFindUnique as any },
    } as AuthorizeDependencies['db'],
    hasher: { compare: mockHasherCompare },
    validator: CredentialsSchema, // Use the real schema as the validator
    uuidv4: mockUuidV4,
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default successful mocks
    mockUuidV4.mockReturnValue(mockUuid);
    // Call mockResolvedValue directly on the correctly typed mock
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockResolvedValue(true);
  });

  // Create a mock logContext
  const mockLogContext = {
    correlationId: mockUuid,
    credentialType: 'object',
  };

  it('should return user object on successful authentication', async () => {
    const localMockDependencies = createMockDependencies();
    const user = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);

    // Assert
    expect(user).toEqual(expectedNextAuthUser);
    expect(mockUuidV4).toHaveBeenCalledTimes(1); // Verify mock UUID was generated
    expect(mockDbUserFindUnique).toHaveBeenCalledWith({
      where: { email: validCredentials.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        hashedPassword: true,
      },
    });
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
    const localMockDependencies = createMockDependencies();
    const zodError = new z.ZodError([]); // Define zodError
    const mockValidator = {
      safeParse: jest.fn().mockReturnValue({ success: false, error: zodError }),
    };
    localMockDependencies.validator = mockValidator as unknown as typeof CredentialsSchema;
    // Expect null when validation fails, not a thrown error
    await expect(
      authorizeLogic({ email: '', password: '' }, localMockDependencies, mockLogContext)
    ).resolves.toBeNull();
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
    const localMockDependencies = createMockDependencies();
    // Override the mock value for this test case
    mockDbUserFindUnique.mockResolvedValue(null);
    const user = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);
    expect(user).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledWith({
      where: { email: validCredentials.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        hashedPassword: true,
      },
    });
    expect(mockHasherCompare).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, email: validCredentials.email }),
      '[Credentials Helper] User not found or no password set'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null and log warning if user has no hashed password', async () => {
    const localMockDependencies = createMockDependencies();
    // Override the mock value for this test case
    mockDbUserFindUnique.mockResolvedValue({
      ...mockPrismaUser,
      hashedPassword: null,
    });
    const user = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);
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
    const localMockDependencies = createMockDependencies();
    // Ensure findUnique mock is set (it is by beforeEach)
    mockHasherCompare.mockResolvedValue(false);
    const result = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);
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
    const localMockDependencies = createMockDependencies();
    const dbError = new Error('Database connection lost');
    // Override with mockRejectedValue for this test case
    mockDbUserFindUnique.mockRejectedValue(dbError);
    const result = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);
    expect(result).toBeNull();
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
      '[Credentials Helper] Error finding or verifying user' // Updated message
    );
  });

  it('should throw original error and log error if password comparison throws', async () => {
    const localMockDependencies = createMockDependencies();
    const compareError = new Error('Bcrypt internal error');
    // Ensure findUnique mock is set (it is by beforeEach)
    mockHasherCompare.mockRejectedValue(compareError);
    const result = await authorizeLogic(validCredentials, localMockDependencies, mockLogContext);
    expect(result).toBeNull();
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
      '[Credentials Helper] Error finding or verifying user' // Updated message
    );
  });
});
