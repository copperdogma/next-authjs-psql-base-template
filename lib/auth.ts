// =============================================================================
// Unit Testing Note:
// Unit testing authentication configurations, especially involving NextAuth.js and
// potentially dependency injection patterns, can be complex. Mocking NextAuth
// internals, session handling, and providers within a Jest environment is often
// challenging. Unit tests for this configuration were skipped due to these
// difficulties.
//
// Validation Strategy:
// The overall authentication flow, including configuration aspects, is primarily
// validated through End-to-End (E2E) tests that simulate real user login and
// session management scenarios.
// =============================================================================

// Import specific types needed from adapters and core, aliasing if necessary
// import { type Adapter, type AdapterUser } from 'next-auth/adapters';
// DO NOT import Session or User from @auth/core/types to avoid conflicts
// import { type Session as CoreSession, type User as CoreUser } from '@auth/core/types';

// Main NextAuth imports - These SHOULD contain augmented types via next-auth.d.ts
import NextAuth from 'next-auth';
// Remove unused type imports
// import {
//   type DefaultSession,
//   type Account,
//   type Profile,
//   type User as NextAuthUser, // Rename to avoid conflict
//   type Session as NextAuthSession,
// } from 'next-auth';
// import type { JWT } from 'next-auth/jwt'; // Remove if JWT type isn't used directly here
// import type { Adapter, AdapterUser } from 'next-auth/adapters'; // Remove if Adapter types aren't used directly here

// Other necessary imports
// import { PrismaAdapter } from '@auth/prisma-adapter'; // Remove if PrismaAdapter isn't used directly here
// import Google from 'next-auth/providers/google'; // Remove if Google provider isn't used directly here
// import { v4 as uuidv4 } from 'uuid'; // Remove if uuid isn't used directly here
import { logger } from '@/lib/logger'; // Keep logger
// import { prisma } from '@/lib/prisma'; // Remove if prisma isn't used directly here
// import { UserRole } from '@/types'; // Remove if UserRole isn't used directly here

// Remove unused helper imports
// import { validateSignInInputs, handleJwtSignIn, handleJwtUpdate } from './auth-jwt-helpers';

// Import the Edge-compatible configuration
import { authConfig } from './auth.config';

// Remove unused Adapter type imports
// import type {
//   AdapterAccount,
//   AdapterSession,
// } from 'next-auth/adapters';

// const HARDCODED_TEST_SECRET = 'test-secret-for-next-auth-test-environment'; // Already removed/handled in auth.config

// logger.info('Initializing NextAuth with combined config...');

// Combine the Edge-compatible config with Node.js specific parts (like adapter)
// This structure will be needed when adding Credentials provider
const combinedAuthConfig = {
  ...authConfig, // Spread the base config (providers, callbacks defined there)
  // Add Node.js specific configurations here if needed in the future
  // For now, just spreading authConfig might be enough if it contains everything
  // adapter: PrismaAdapter(prisma), // Example: Adapter would go here
};

// Initialize NextAuth with the combined configuration
const { handlers, auth, signIn, signOut } = NextAuth(combinedAuthConfig);

logger.info('NextAuth initialized (lib/auth.ts).');

// Export the handlers and the auth function
export { handlers, auth, signIn, signOut };

// You might also export the config itself if needed elsewhere, though it's often better
// to centralize configuration access through this file.
// export { authConfig };
