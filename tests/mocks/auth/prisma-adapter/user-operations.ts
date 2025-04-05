import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterUser } from 'next-auth/adapters';

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
        },
      });
      return user as AdapterUser;
    },

    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user as AdapterUser | null;
    },

    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user as AdapterUser | null;
    },

    getUserByAccount: async ({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) => {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      return account?.user as AdapterUser | null;
    },

    updateUser: async (data: Partial<AdapterUser> & { id: string }) => {
      const user = await prisma.user.update({
        where: { id: data.id },
        data,
      });
      return user as AdapterUser;
    },

    deleteUser: async (userId: string) => {
      await prisma.user.delete({ where: { id: userId } });
      return null;
    },
  };
}
