import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterSession, AdapterUser } from 'next-auth/adapters';
import { UserRole } from '@/types';

/**
 * Convert Prisma UserRole to application UserRole
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
 * Format session data for adapter
 */
function formatSessionData(session: {
  userId: string;
  sessionToken: string;
  expires: Date;
}): AdapterSession {
  return {
    userId: session.userId,
    sessionToken: session.sessionToken,
    expires: session.expires,
  } as AdapterSession;
}

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

      return formatSessionData(session);
    },

    getSessionAndUser: async (sessionToken: string) => {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!session) return null;

      // Convert Prisma UserRole to our application UserRole
      const adaptedUser = {
        ...session.user,
        role: convertUserRole(session.user.role),
      };

      // Cast to the required format
      return {
        session: formatSessionData({ ...session, sessionToken }),
        user: adaptedUser as unknown as AdapterUser,
      };
    },

    updateSession: async (data: Partial<AdapterSession> & { sessionToken: string }) => {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      });

      if (!session) return null;
      return formatSessionData({ ...session, sessionToken: data.sessionToken });
    },

    deleteSession: async (sessionToken: string) => {
      await prisma.session.delete({ where: { sessionToken } });
    },
  };
}
