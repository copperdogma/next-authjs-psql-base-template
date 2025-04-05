import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterSession, AdapterUser } from 'next-auth/adapters';

/**
 * Session operations for the mock PrismaAdapter
 */
export function createSessionOperations(prisma: PrismaClient) {
  return {
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

    getSessionAndUser: async (sessionToken: string) => {
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

    updateSession: async (data: Partial<AdapterSession> & { sessionToken: string }) => {
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

    deleteSession: async (sessionToken: string) => {
      await prisma.session.delete({ where: { sessionToken } });
    },
  };
}
