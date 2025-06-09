/**
 * Prisma Mock Implementation
 *
 * This file provides a comprehensive mock implementation of the Prisma client for testing.
 * It uses jest-mock-extended to create deep mocks and follows a singleton pattern to ensure
 * consistent state across all tests.
 *
 * ## Architecture:
 * - Singleton Pattern: One shared mock instance across all tests
 * - Deep Mocking: All Prisma methods are automatically mocked
 * - Default Implementations: Common operations have sensible defaults
 * - Extensible: Individual tests can override specific behaviors
 *
 * ## Usage Examples:
 *
 * ### Basic Usage in Tests:
 * ```typescript
 * import { prismaMock } from '@/__mocks__/db/prismaMocks';
 *
 * // Use default mocks (returns mockUser data)
 * const user = await userService.getUserById('123');
 * expect(prismaMock.user.findUnique).toHaveBeenCalled();
 * ```
 *
 * ### Override Specific Behaviors:
 * ```typescript
 * // Override for specific test scenarios
 * prismaMock.user.findUnique.mockResolvedValue(null); // Simulate not found
 * prismaMock.user.create.mockRejectedValue(new Error('DB error')); // Simulate error
 * ```
 *
 * ### Reset Between Tests:
 * ```typescript
 * import { resetPrismaMock } from '@/__mocks__/db/prismaMocks';
 *
 * beforeEach(() => {
 *   resetPrismaMock(); // Clears all call history and restores defaults
 * });
 * ```
 *
 * ## Mock Factory Pattern:
 * The file provides factory functions that create mock data with sensible defaults.
 * This ensures tests are predictable and reduces boilerplate setup code.
 */

import { PrismaClient, User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { mockUser as defaultMockUserData } from '../data/mockData'; // Corrected path

/**
 * Singleton Prisma mock instance
 *
 * This is the main mock that should be imported in tests. It provides deep mocking
 * of all Prisma client methods with intelligent defaults for common operations.
 */
export const prismaMock = mockDeep<PrismaClient>();

// Create a type for user relations to avoid using 'any'
type UserRelations = {
  accounts: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
};

// Default user data that includes relations (empty arrays for now)
const fullMockUser: User & UserRelations = {
  ...defaultMockUserData,
  accounts: [],
  sessions: [],
};

/**
 * Mock Factory: Sets up intelligent default implementations for Prisma operations
 *
 * This function provides sensible defaults for common database operations:
 * - CRUD operations return predictable mock data
 * - Transactions are properly mocked to work with test code
 * - Raw queries return empty results by default
 *
 * These defaults can be overridden in individual tests for specific scenarios.
 */
const setDefaultPrismaMocks = () => {
  // Default User mocks
  prismaMock.user.findUnique.mockResolvedValue(fullMockUser);
  prismaMock.user.findMany.mockResolvedValue([fullMockUser]);

  // Create mock
  // @ts-expect-error Type is too complex to match exactly, but it works for tests
  prismaMock.user.create.mockImplementation(args => {
    const id = args.data.id || defaultMockUserData.id || `mock-created-id-${Date.now()}`;
    return Promise.resolve({
      ...defaultMockUserData,
      ...args.data,
      id,
    });
  });

  // Update mock
  // @ts-expect-error Type is too complex to match exactly, but it works for tests
  prismaMock.user.update.mockImplementation(args => {
    const id = (args.where.id as string) || defaultMockUserData.id;
    return Promise.resolve({
      ...defaultMockUserData,
      ...(args.data as Record<string, unknown>),
      id,
    });
  });

  prismaMock.user.delete.mockResolvedValue(fullMockUser);

  // Transaction mock
  // @ts-expect-error Type is too complex to match exactly, but it works for tests
  prismaMock.$transaction.mockImplementation(fn => {
    if (typeof fn === 'function') {
      return fn(prismaMock);
    }
    return Promise.resolve([]);
  });

  // Raw query mocks
  prismaMock.$executeRaw.mockResolvedValue(0);
  prismaMock.$queryRaw.mockResolvedValue([]);
};

// Apply defaults when the mock is initialized
setDefaultPrismaMocks();

/**
 * Reset Function: Cleans mock state and restores defaults
 *
 * Use this function in test setup (beforeEach) to ensure clean state:
 * - Clears all call history and mock implementations
 * - Restores intelligent defaults for predictable test behavior
 * - Prevents test pollution and interdependencies
 *
 * ## Best Practices:
 * - Call in beforeEach for consistent test isolation
 * - Call after tests that modify global mock state
 * - Prefer this over manual mock.mockReset() calls
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
  setDefaultPrismaMocks(); // Re-apply defaults after reset
};

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
