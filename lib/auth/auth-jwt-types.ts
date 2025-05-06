import { type JWT } from 'next-auth/jwt';
import { type AdapterUser } from 'next-auth/adapters';
import { type Account, type Profile, type Session, type User as NextAuthUser } from 'next-auth';
import { UserRole } from '@/types';
import {
  findOrCreateUserAndAccountInternal,
  prepareProfileDataForDb,
  validateSignInInputs,
  type AuthUserInternal,
} from './auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// ====================================
// JWT Helper Types/Interfaces
// ====================================

// Define base JWT input/output types
export type JwtInput = JWT;
export type JwtOutput = JWT;

// Define a generic type for JWT callbacks
export type AuthJwtCallback<TArgs, TReturn> = (args: TArgs) => Promise<TReturn>;

/**
 * Represents the structure of the arguments for the handleJwtSignIn function.
 */
export interface HandleJwtSignInArgs {
  token: JWT;
  user: NextAuthUser | AdapterUser;
  account: Account | null;
  profile?: Profile;
  correlationId: string;
  dependencies?: {
    findOrCreateUser: typeof findOrCreateUserAndAccountInternal;
    prepareProfile: typeof prepareProfileDataForDb;
    validateInputs: typeof validateSignInInputs;
    uuidv4: typeof uuidv4;
  };
}

// Define a type for the JWT update arguments
export interface HandleJwtUpdateArgs {
  token: JWT;
  session: Session;
  correlationId: string;
  dependencies?: {
    uuidv4: typeof uuidv4;
  };
}

// Default dependencies to use when none are provided
export const defaultDependencies = {
  findOrCreateUser: findOrCreateUserAndAccountInternal,
  prepareProfile: prepareProfileDataForDb,
  validateInputs: validateSignInInputs,
  uuidv4: uuidv4,
};

// Type for OAuth DB User
export type OAuthDbUser = {
  userId: string;
  userEmail: string;
  name?: string | null | undefined;
  image?: string | null | undefined;
  role?: UserRole | null | undefined;
};

// Define a type for the DB user step result
export type DbUserStepResult = {
  success: boolean;
  dbUser?: OAuthDbUser;
  fallbackToken?: JWT;
};

// Re-export necessary types from auth-helpers for consumers
export type { AuthUserInternal };
