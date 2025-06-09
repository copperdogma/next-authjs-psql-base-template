import { PrismaClient } from '@prisma/client';
import { Adapter } from 'next-auth/adapters';

// Import operations from modular files
import { createUserOperations } from './prisma-adapter/user-operations';
import { createAccountOperations } from './prisma-adapter/account-operations';
import { createSessionOperations } from './prisma-adapter/session-operations';
import { createVerificationOperations } from './prisma-adapter/verification-operations';

/**
 * Mock implementation of PrismaAdapter for testing environments
 *
 * This is a full, in-memory re-implementation of the @auth/prisma-adapter that enables
 * comprehensive testing of authentication logic without requiring a live database connection.
 * It provides the same interface as the real adapter but operates entirely in memory,
 * making tests faster and more isolated.
 *
 * Key features:
 * - Full compatibility with NextAuth.js adapter interface
 * - In-memory data storage for test isolation
 * - Modular implementation for better maintainability
 * - Comprehensive support for all auth operations (users, accounts, sessions, verification)
 *
 * The implementation is split into modular files for better code organization
 * and to comply with max-lines-per-function requirements.
 */
export function PrismaAdapter(prisma: PrismaClient): Adapter {
  // Create operation modules
  const userOperations = createUserOperations(prisma);
  const accountOperations = createAccountOperations(prisma);
  const sessionOperations = createSessionOperations(prisma);
  const verificationOperations = createVerificationOperations(prisma);

  // Combine all operations into a single adapter
  return {
    // User operations
    createUser: userOperations.createUser,
    getUser: userOperations.getUser,
    getUserByEmail: userOperations.getUserByEmail,
    getUserByAccount: userOperations.getUserByAccount,
    updateUser: userOperations.updateUser,
    deleteUser: userOperations.deleteUser,

    // Account operations
    linkAccount: accountOperations.linkAccount,
    unlinkAccount: accountOperations.unlinkAccount,

    // Session operations
    createSession: sessionOperations.createSession,
    getSessionAndUser: sessionOperations.getSessionAndUser,
    updateSession: sessionOperations.updateSession,
    deleteSession: sessionOperations.deleteSession,

    // Verification operations
    createVerificationToken: verificationOperations.createVerificationToken,
    useVerificationToken: verificationOperations.useVerificationToken,
  };
}
