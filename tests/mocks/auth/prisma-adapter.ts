import { PrismaClient } from '@prisma/client';
import { Adapter } from 'next-auth/adapters';

// Import operations from modular files
import { createUserOperations } from './prisma-adapter/user-operations';
import { createAccountOperations } from './prisma-adapter/account-operations';
import { createSessionOperations } from './prisma-adapter/session-operations';
import { createVerificationOperations } from './prisma-adapter/verification-operations';

/**
 * Mock implementation of PrismaAdapter for testing
 * This serves as a drop-in replacement for @auth/prisma-adapter
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
