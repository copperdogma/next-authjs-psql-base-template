import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';

/**
 * Mock implementation of PrismaAdapter for testing
 * This serves as a drop-in replacement for @auth/prisma-adapter
 */
export function PrismaAdapter(prisma: PrismaClient): Adapter {
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

    getUser: async id => {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user as AdapterUser | null;
    },

    getUserByEmail: async email => {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user as AdapterUser | null;
    },

    getUserByAccount: async ({ provider, providerAccountId }) => {
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

    linkAccount: async (data: AdapterAccount) => {
      await prisma.account.create({
        data: {
          id: uuidv4(),
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      });
      return data;
    },

    unlinkAccount: async ({ provider, providerAccountId }) => {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });
    },

    createSession: async (data: AdapterSession) => {
      const session = await prisma.session.create({
        data: {
          id: uuidv4(),
          userId: data.userId,
          sessionToken: data.sessionToken,
          expires: data.expires,
        },
      });

      return {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      } as AdapterSession;
    },

    getSessionAndUser: async sessionToken => {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!session) return null;

      // Cast to the required format
      return {
        session: {
          userId: session.userId,
          sessionToken,
          expires: session.expires,
        } as AdapterSession,
        user: session.user as AdapterUser,
      };
    },

    updateSession: async data => {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      });

      if (!session) return null;

      // Cast to AdapterSession
      return {
        userId: session.userId,
        sessionToken: data.sessionToken,
        expires: session.expires,
      } as AdapterSession;
    },

    deleteSession: async sessionToken => {
      await prisma.session.delete({ where: { sessionToken } });
    },

    createVerificationToken: async data => {
      await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return data;
    },

    useVerificationToken: async ({ identifier, token }) => {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: {
          identifier_token: { identifier, token },
        },
      });

      if (!verificationToken) return null;

      await prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier, token },
        },
      });

      return verificationToken;
    },
  };
}
