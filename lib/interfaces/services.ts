import { User } from '@prisma/client';
import { Session } from 'next-auth';
import { AuthOptions } from 'next-auth';
import type { RawQueryService, PrismaClientService } from './database-services';

// Re-export database interfaces
export type { RawQueryService, PrismaClientService };

export interface SessionService {
  /**
   * Gets the current user session
   */
  getServerSession: (options?: AuthOptions) => Promise<Session | null>;
}

export interface UserService {
  /**
   * Updates a user's name in the database
   */
  updateUserName: (userId: string, name: string) => Promise<User>;

  /**
   * Finds a user by their ID
   */
  findUserById: (userId: string) => Promise<User | null>;

  /**
   * Finds a user by their email
   */
  findUserByEmail: (email: string) => Promise<User | null>;
}

export interface LoggerService {
  /**
   * Log at info level
   */
  info: (obj: object | string, msg?: string) => void;

  /**
   * Log at error level
   */
  error: (obj: object | string, msg?: string) => void;

  /**
   * Log at warn level
   */
  warn: (obj: object | string, msg?: string) => void;

  /**
   * Log at debug level
   */
  debug: (obj: object | string, msg?: string) => void;
}

export interface FirebaseAdminService {
  /**
   * Gets the Firebase Admin Auth instance
   */
  auth: () => {
    /**
     * Gets a Firebase user by email
     */
    getUserByEmail: (email: string) => Promise<{
      uid: string;
      email?: string;
      displayName?: string;
    }>;

    /**
     * Updates a Firebase user
     */
    updateUser: (uid: string, data: { displayName?: string }) => Promise<unknown>;
  };
}
