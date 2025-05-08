//
// Manual mock for the Prisma client singleton
//

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

// Create mock functions with promise resolving capabilities
const createMockWithPromise = () => {
  const mock = jest.fn();
  // Use type assertions to fix type issues
  (mock as any).mockResolvedValue = jest.fn().mockImplementation((value: any) => {
    mock.mockImplementation(() => Promise.resolve(value));
    return mock;
  });
  (mock as any).mockRejectedValue = jest.fn().mockImplementation((value: any) => {
    mock.mockImplementation(() => Promise.reject(value));
    return mock;
  });
  return mock;
};

// Create a properly mocked Prisma client that supports Jest mocking methods
// @ts-expect-error - Keep as reference for how to create test mocks
const _mockPrisma = {
  session: {
    deleteMany: createMockWithPromise(),
    findFirst: createMockWithPromise(),
    findMany: createMockWithPromise(),
    create: createMockWithPromise(),
    update: createMockWithPromise(),
    delete: createMockWithPromise(),
  },
  user: {
    findUnique: createMockWithPromise(),
    findFirst: createMockWithPromise(),
    findMany: createMockWithPromise(),
    create: createMockWithPromise(),
    update: createMockWithPromise(),
    delete: createMockWithPromise(),
  },
  $transaction: jest.fn((callback: () => any) => callback()),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Create and export the mock Prisma client instance
const mockInstance = mockDeep<PrismaClient>();

export const prisma = mockInstance;

// If the original lib/prisma.ts has a default export, provide one here too.
// Assuming it might, to be safe, though often it's just a named export.
// Check actual lib/prisma.ts if this causes issues.
export default mockInstance;

// Function to reset all mocks
export const resetPrismaMock = () => {
  jest.clearAllMocks();
};

// Also mock disconnectPrisma function
export const disconnectPrisma = jest.fn();
