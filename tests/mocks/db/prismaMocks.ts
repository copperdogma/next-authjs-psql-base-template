import { PrismaClient, User, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { mockUser as defaultMockUserData } from '../data/mockData'; // Corrected path

export const prismaMock = mockDeep<PrismaClient>();

// Default user data that includes relations (empty arrays for now)
const fullMockUser: User & { accounts: any[]; sessions: any[] } = {
  ...defaultMockUserData,
  accounts: [],
  sessions: [],
};

// Function to set default mock implementations
const setDefaultPrismaMocks = () => {
  // Default User mocks
  prismaMock.user.findUnique.mockResolvedValue(fullMockUser);
  prismaMock.user.findMany.mockResolvedValue([fullMockUser]);
  prismaMock.user.create.mockImplementation((async (args: Prisma.UserCreateArgs) => {
    const id = args.data.id || defaultMockUserData.id || `mock-created-id-${Date.now()}`;
    return {
      ...defaultMockUserData,
      ...args.data,
      id,
      // Relational fields are typically not returned directly unless selected/included,
      // for a basic mock, returning the core User data is usually sufficient.
      // If tests need to check relations on create, they can override this mock.
    } as User;
  }) as any);
  prismaMock.user.update.mockImplementation((async (args: Prisma.UserUpdateArgs) => {
    const id = args.where.id || defaultMockUserData.id;
    return {
      ...defaultMockUserData,
      ...(args.data as any),
      id,
    } as User;
  }) as any);
  prismaMock.user.delete.mockResolvedValue(fullMockUser);
  // Add other common user queries if needed: upsert, findFirst, etc.

  // Example for another model if you had one, e.g., Post
  // prismaMock.post.findUnique.mockResolvedValue(null); // Default to not found or a mock post
  // prismaMock.post.findMany.mockResolvedValue([]);

  // Mock $transaction to execute the callback and return its result by default
  prismaMock.$transaction.mockImplementation(async (callbackOrArray: any) => {
    if (typeof callbackOrArray === 'function') {
      return callbackOrArray(prismaMock);
    }
    // For array of operations, just return mock results for now, or implement more complex logic
    return Promise.all(callbackOrArray.map(() => Promise.resolve({ mockResult: true })));
  });

  // Mock $executeRaw and $queryRaw to return default values or allow configuration
  prismaMock.$executeRaw.mockResolvedValue(0); // Default to 0 affected rows
  prismaMock.$queryRaw.mockResolvedValue([]); // Default to empty array
};

// Apply defaults when the mock is initialized
setDefaultPrismaMocks();

export const resetPrismaMock = () => {
  mockReset(prismaMock);
  setDefaultPrismaMocks(); // Re-apply defaults after reset
};

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
