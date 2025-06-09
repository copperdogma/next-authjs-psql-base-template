import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterSession, AdapterUser } from 'next-auth/adapters';
import { UserRole } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Convert Prisma UserRole to application UserRole
 */
function convertUserRole(roleString: string): UserRole {
  return roleString === 'USER'
    ? UserRole.USER
    : roleString === 'ADMIN'
      ? UserRole.ADMIN
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

// Mock session data type (adjust as needed for your tests)
interface MockSessionData {
  userId?: string;
  expires?: Date;
  hasActiveSubscription?: boolean;
  credits?: number;
  [key: string]: unknown; // Allow other properties
}

// Mock session object type returned by findUserSession
interface MockSession extends AdapterSession {
  userId: string;
  // Add other properties if your adapter/session includes them
}

// Helper function to map session data to UserRole
function mapSessionToRole(sessionData: MockSessionData | null): UserRole {
  logger.debug('[Mock Session] Mapping session to role, defaulting to USER', sessionData);
  // Example logic if needed, otherwise default:
  if (sessionData?.userId === 'admin-user-id') {
    return UserRole.ADMIN;
  }
  return UserRole.USER;
}

// Mock function for getting user role from session
export const getUserRoleFromSession = jest.fn((sessionData: MockSessionData | null): UserRole => {
  return mapSessionToRole(sessionData);
});

// Mock function for finding a user session
export const findUserSession = jest.fn(async (sessionId: string): Promise<MockSession | null> => {
  logger.debug('[Mock Session] Finding user session', { sessionId });
  if (sessionId === 'valid-session-id') {
    // Return an object matching the AdapterSession structure + userId
    return {
      sessionToken: sessionId,
      userId: 'user-id-from-session',
      expires: new Date(Date.now() + 3600 * 1000),
    };
  }
  return null;
});

// Mock function for creating a user session
// The actual return type depends on what your createUserSession is expected to return.
// Assuming it returns something compatible with AdapterSession:
export const createUserSession = jest.fn(async (userId: string): Promise<AdapterSession> => {
  logger.debug('[Mock Session] Creating user session', { userId });
  const sessionToken = `mock-session-token-${userId}`;
  return {
    sessionToken: sessionToken,
    userId: userId,
    expires: new Date(Date.now() + 3600 * 1000),
  };
});

// Mock function for deleting a user session
export const deleteUserSession = jest.fn(async (sessionId: string): Promise<void> => {
  logger.debug('[Mock Session] Deleting user session', { sessionId });
  // Simulate deletion
});
