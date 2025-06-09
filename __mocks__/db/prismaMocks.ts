import { PrismaClient, User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { mockUser as defaultMockUserData } from '../data/mockData'; // Corrected path

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

// Function to set default mock implementations
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

export const resetPrismaMock = () => {
  mockReset(prismaMock);
  setDefaultPrismaMocks(); // Re-apply defaults after reset
};

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
