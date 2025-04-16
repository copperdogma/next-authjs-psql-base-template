import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterUser } from 'next-auth/adapters';
import { UserRole } from '@/types';

// Define an interface to replace 'any'
interface PrismaUser {
  id: string;
  email?: string | null;
  emailVerified?: Date | null;
  name?: string | null;
  image?: string | null;
  role: string;
  [key: string]: unknown;
}

/**
 * Convert Prisma UserRole string to application UserRole enum
 */
function convertUserRole(roleString: string): UserRole {
  return roleString === 'USER'
    ? UserRole.USER
    : roleString === 'ADMIN'
      ? UserRole.ADMIN
      : roleString === 'GUEST'
        ? UserRole.GUEST
        : UserRole.USER;
}

/**
 * Format user data with the correct role for the adapter
 */
function formatUserForAdapter(user: PrismaUser): AdapterUser {
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
  if (role === UserRole.GUEST) return 'GUEST';
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
  return formatUserForAdapter(account.user as PrismaUser);
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

      return formatUserForAdapter(user as PrismaUser);
    },

    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;
      return formatUserForAdapter(user as PrismaUser);
    },

    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;
      return formatUserForAdapter(user as PrismaUser);
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

      return formatUserForAdapter(user as PrismaUser);
    },

    deleteUser: async (userId: string) => {
      await prisma.user.delete({ where: { id: userId } });
      return null;
    },
  };
}
