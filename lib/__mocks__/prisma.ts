//
// Manual mock for the Prisma client singleton
//

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create a deep mock of the PrismaClient instance
const prismaMock = mockDeep<PrismaClient>();

// Export only the mocked instance as 'prisma'
export const prisma = prismaMock;

// Optional: Function to reset the mock before each test
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};
