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
  beforeEach(() => {
    // Clear all mock implementations and calls before each test
    jest.clearAllMocks();
    mockDbUserFindUnique.mockReset();
    mockHasherCompare.mockReset();
    mockUuidV4.mockClear(); // Ensure uuid mock is cleared
  });

  it('should return NextAuth user on successful authorization', async () => {
    // Arrange
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockResolvedValue(true);

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toEqual(expectedNextAuthUser);
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

  it('should throw error and log warning for invalid credentials format (not object)', async () => {
    // Arrange
    const invalidInput = null;

    // Act & Assert
    await expect(authorizeLogic(invalidInput, mockDependencies)).rejects.toThrow(
      'Invalid credentials provided.'
    );
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, receivedType: 'object' }), // Check mock correlationId
      '[Credentials Validation] Invalid credentials type received.'
    );
    expect(mockDbUserFindUnique).not.toHaveBeenCalled();
    expect(mockHasherCompare).not.toHaveBeenCalled();
  });

  it('should throw error and log warning for invalid email format', async () => {
    // Arrange
    const invalidCreds = { email: 'invalid-email', password: 'password123' };

    // Act & Assert
    await expect(authorizeLogic(invalidCreds, mockDependencies)).rejects.toThrow(
      'Invalid credentials provided.'
    );
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid }), // Check mock correlationId
      expect.stringContaining('[Credentials Validation] Invalid credentials: Invalid email address')
    );
    expect(mockDbUserFindUnique).not.toHaveBeenCalled();
    expect(mockHasherCompare).not.toHaveBeenCalled();
  });

  it('should throw error and log warning for missing password', async () => {
    // Arrange
    const invalidCreds = { email: 'test@example.com', password: '' };

    // Act & Assert
    await expect(authorizeLogic(invalidCreds, mockDependencies)).rejects.toThrow(
      'Invalid credentials provided.'
    );
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid }), // Check mock correlationId
      expect.stringContaining('[Credentials Validation] Invalid credentials: Password is required')
    );
    expect(mockDbUserFindUnique).not.toHaveBeenCalled();
    expect(mockHasherCompare).not.toHaveBeenCalled();
  });

  it('should return null and log warning if user is not found', async () => {
    // Arrange
    mockDbUserFindUnique.mockResolvedValue(null);

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockDbUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, email: validCredentials.email }),
      '[Credentials Helper] User not found or no password set'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null and log warning if user has no hashed password', async () => {
    // Arrange
    mockDbUserFindUnique.mockResolvedValue({
      ...mockPrismaUser,
      hashedPassword: null,
    });

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
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
    mockHasherCompare.mockResolvedValue(false);

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(mockHasherCompare).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, userId: mockPrismaUser.id }),
      '[Credentials Helper] Incorrect password'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return null and log error if db query fails', async () => {
    // Arrange
    const dbError = new Error('Database connection error');
    mockDbUserFindUnique.mockRejectedValue(dbError);

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, err: dbError }),
      '[Credentials Authorize Logic] System error during authorization process'
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should return null and log error if password comparison throws', async () => {
    // Arrange
    const hashError = new Error('bcrypt error');
    mockDbUserFindUnique.mockResolvedValue(mockPrismaUser);
    mockHasherCompare.mockRejectedValue(hashError);

    // Act
    const result = await authorizeLogic(validCredentials, mockDependencies);

    // Assert
    expect(result).toBeNull();
    expect(mockUuidV4).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: mockUuid, err: hashError }),
      '[Credentials Authorize Logic] System error during authorization process'
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
