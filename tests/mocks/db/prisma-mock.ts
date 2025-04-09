import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

/**
 * Mocked instance of the Prisma client for use in tests
 */
export const prismaMock = mockDeep<PrismaClient>();

/**
 * Resets all mock implementations and calls on the prismaMock
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
