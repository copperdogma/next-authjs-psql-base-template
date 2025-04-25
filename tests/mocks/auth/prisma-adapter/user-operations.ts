import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterUser } from 'next-auth/adapters';
import { UserRole } from '@/types';
import { logger } from '@/lib/logger';

// Mock Prisma User type (include fields used in mock)
interface MockPrismaUser {
  id: string;
  email: string;
  emailVerified?: Date | string | null; // Allow string for simpler mock data
  name?: string | null;
  image?: string | null;
  role: string; // Prisma role is likely string before mapping
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Convert Prisma UserRole string to application UserRole enum
 */
function convertUserRole(roleString: string): UserRole {
  return roleString === 'USER'
    ? UserRole.USER
    : roleString === 'ADMIN'
      ? UserRole.ADMIN
      : UserRole.USER;
}

/**
 * Format user data with the correct role for the adapter
 */
function formatUserForAdapter(user: MockPrismaUser): AdapterUser {
  return {
    ...user,
    role: convertUserRole(user.role),
  } as unknown as AdapterUser;
}

/**
 * Convert application UserRole enum to Prisma role string
 */
function convertToDbRole(role: UserRole): string {
  if (role === UserRole.ADMIN) return 'ADMIN';
  if (role === UserRole.USER) return 'USER';
  return 'USER'; // Default
}

// Helper functions that will be used by createUserOperations
/**
 * Find a user by their account
 */
async function findUserByAccount(
  prisma: PrismaClient,
  provider: string,
  providerAccountId: string
) {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    include: { user: true },
  });

  if (!account?.user) return null;
  return formatUserForAdapter(account.user as MockPrismaUser);
}

/**
 * Prepare update data for user
 */
function prepareUserUpdateData(userData: Partial<AdapterUser> & { id: string }) {
  const { role, ...restUserData } = userData;
  const updateData = { ...restUserData };

  if (role !== undefined) {
    Object.assign(updateData, { role: convertToDbRole(role as UserRole) });
  }

  return updateData;
}

/**
 * User operations for the mock PrismaAdapter
 */
export function createUserOperations(prisma: PrismaClient) {
  return {
    createUser: async (data: Omit<AdapterUser, 'id'>) => {
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
          role: 'USER', // Default role
        },
      });

      return formatUserForAdapter(user as MockPrismaUser);
    },

    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;
      return formatUserForAdapter(user as MockPrismaUser);
    },

    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;
      return formatUserForAdapter(user as MockPrismaUser);
    },

    getUserByAccount: async ({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) => {
      return findUserByAccount(prisma, provider, providerAccountId);
    },

    updateUser: async (userData: Partial<AdapterUser> & { id: string }) => {
      const updateData = prepareUserUpdateData(userData);

      const user = await prisma.user.update({
        where: { id: userData.id },
        data: updateData,
      });

      return formatUserForAdapter(user as MockPrismaUser);
    },

    deleteUser: async (userId: string) => {
      await prisma.user.delete({ where: { id: userId } });
      return null;
    },
  };
}

// Simplified role mapping for mocks - avoids GUEST
/*
function mapRoleToString(role: UserRole): string {
  if (role === UserRole.ADMIN) return 'ADMIN';
  return 'USER'; // Default to USER, GUEST is not in Prisma schema
}
*/

// Helper to map DB user (MockPrismaUser) to AdapterUser
function mapToAdapterUser(dbUser: MockPrismaUser | null): AdapterUser | null {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    emailVerified: dbUser.emailVerified ? new Date(dbUser.emailVerified) : null,
    name: dbUser.name ?? null, // Ensure null if undefined
    image: dbUser.image ?? null, // Ensure null if undefined
    // Map the string role from mock DB to UserRole enum
    role: mapStringToRole(dbUser.role), // Added back role mapping
  };
}

// Mock: Convert string role to UserRole enum value
// Simplified: Only ADMIN and USER exist
export function mapStringToRole(roleString: string | undefined): UserRole {
  return roleString === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;
}

// Mock: Convert UserRole enum to string
// Simplified: Only ADMIN and USER exist
export function mapRoleToStringSafe(role: UserRole | undefined): string {
  if (role === UserRole.ADMIN) return 'ADMIN';
  return 'USER'; // Default to USER
}

// Mock implementations returning AdapterUser | null
export const getUser = jest.fn(async (id: string): Promise<AdapterUser | null> => {
  logger.debug('[Mock User] Get user by ID', { id });
  if (id === 'existing-user-id') {
    const mockDbUser: MockPrismaUser = {
      id: 'existing-user-id',
      email: 'user@example.com',
      role: 'USER',
    };
    return mapToAdapterUser(mockDbUser);
  }
  return null;
});

export const getUserByEmail = jest.fn(async (email: string): Promise<AdapterUser | null> => {
  logger.debug('[Mock User] Get user by email', { email });
  if (email === 'user@example.com') {
    const mockDbUser: MockPrismaUser = {
      id: 'existing-user-id',
      email: 'user@example.com',
      role: 'USER',
    };
    return mapToAdapterUser(mockDbUser);
  }
  return null;
});

export const getUserByAccount = jest.fn(
  async ({
    providerAccountId,
    provider,
  }: {
    providerAccountId: string;
    provider: string;
  }): Promise<AdapterUser | null> => {
    logger.debug('[Mock User] Get user by account', { providerAccountId, provider });
    if (provider === 'google' && providerAccountId === 'google-account-id') {
      const mockDbUser: MockPrismaUser = {
        id: 'google-user-id',
        email: 'google@example.com',
        role: 'USER',
      };
      return mapToAdapterUser(mockDbUser);
    }
    return null;
  }
);

export const updateUser = jest.fn(
  async (user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> => {
    logger.debug('[Mock User] Update user', { userId: user.id });
    // Simulate update, return the updated user matching AdapterUser
    const updatedDbUser: MockPrismaUser = {
      id: user.id,
      email: user.email ?? 'updated@example.com', // Provide default if needed
      name: user.name,
      image: user.image,
      role: 'USER', // Role doesn't usually change here
      updatedAt: new Date(),
    };
    return mapToAdapterUser(updatedDbUser) as AdapterUser; // Assert non-null
  }
);

export const deleteUser = jest.fn(async (userId: string): Promise<void> => {
  logger.debug('[Mock User] Delete user', { userId });
  // Simulate deletion
});

export const createUser = jest.fn(async (user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> => {
  logger.debug('[Mock User] Create user', { email: user.email });
  const userId = `new-user-${Date.now()}`;
  const newDbUser: MockPrismaUser = {
    ...user,
    id: userId,
    // Map the role from AdapterUser input back to a string for the mock DB
    role: mapRoleToStringSafe(user.role), // Use mapRoleToStringSafe here
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return mapToAdapterUser(newDbUser) as AdapterUser;
});
