import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sharedAuthConfig } from './auth-shared';
import {
  authorizeLogic,
  CredentialsSchema,
  type AuthorizeDependencies,
} from './auth/auth-credentials';
// Import helpers from the auth helper file - RE-ADD THIS
import {
  findOrCreateUserAndAccountInternal,
  prepareProfileDataForDb,
  validateSignInInputs,
} from './auth/auth-helpers'; // Use correct path
// Import JWT handlers
import { handleJwtSignIn, handleJwtUpdate } from './auth/auth-jwt'; // Use correct path
import { type HandleJwtSignInArgs } from './auth/auth-jwt-types'; // Corrected import path

// ====================================
// Interfaces (Should be minimal or none)
// ====================================
// Validator interface moved to auth-credentials.ts
// AuthorizeDependencies interface moved to auth-credentials.ts

// ====================================
// Auth Helper Functions (None should remain)
// ====================================
// authorizeLogic moved to auth-credentials.ts

// ====================================
// Node-Specific Auth Configuration (Core Purpose of this file now)
// ====================================
// CredentialsSchema moved to auth-credentials.ts

// Prepare dependencies for authorizeLogic (Restore this block)
const dependencies: AuthorizeDependencies = {
  db: {
    user: {
      findUnique: prisma.user.findUnique,
    },
  },
  hasher: {
    compare: bcrypt.compare,
  },
  validator: {
    safeParse: CredentialsSchema.safeParse,
  },
  // Pass the real uuidv4 function
  uuidv4: uuidv4,
};

// Prepare dependencies for handleJwtSignIn
const jwtSignInDependencies = {
  findOrCreateUser: findOrCreateUserAndAccountInternal,
  prepareProfile: prepareProfileDataForDb,
  validateInputs: validateSignInInputs,
  // Note: _buildUserFromCreds is internal to handleJwtSignIn now
  uuidv4: uuidv4, // Pass the real uuidv4
};

// Extend the shared config with node-specific parts
export const authConfigNode: NextAuthConfig = {
  ...sharedAuthConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(sharedAuthConfig.providers || []),
    // Restore CredentialsProvider configuration
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Define fields expected from the login form
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        logger.debug(
          { provider: 'credentials' },
          '[Credentials Provider] Authorize function invoked'
        );
        try {
          // Use authorizeLogic with injected dependencies
          const user = await authorizeLogic(credentials, dependencies);
          if (user) {
            logger.info(
              { provider: 'credentials', userId: user.id },
              '[Credentials Provider] Authorization successful'
            );
            return user;
          } else {
            logger.warn(
              { provider: 'credentials', email: credentials?.email },
              '[Credentials Provider] Authorization failed (null user returned)'
            );
            return null; // Indicate failure
          }
        } catch (error: unknown) {
          // Log errors from authorizeLogic (e.g., validation errors)
          logger.error(
            {
              provider: 'credentials',
              err: error instanceof Error ? error.message : String(error),
            },
            '[Credentials Provider] Error during authorization'
          );
          return null; // Indicate failure
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    ...sharedAuthConfig.callbacks,
    async jwt({ token, user, account, profile, trigger, session }) {
      const correlationId = uuidv4();
      logger.debug({ trigger, correlationId }, '[JWT Callback] Invoked');

      // 1. Sign-in / Sign-up flow (user, account, profile available)
      if (user && account) {
        logger.info({ trigger, correlationId }, '[JWT Callback] Sign-in/Sign-up flow');
        const args: HandleJwtSignInArgs = {
          token,
          user,
          account,
          profile,
          correlationId,
          dependencies: jwtSignInDependencies, // Pass dependencies
        };
        return handleJwtSignIn(args);
      }

      // 2. Session update flow (trigger = 'update')
      if (trigger === 'update' && session) {
        logger.info({ trigger, correlationId }, '[JWT Callback] Update flow');
        // The handleJwtUpdate signature expects token, session, correlationId, { uuidv4 }
        return handleJwtUpdate(token, session, correlationId, { uuidv4 }); // Pass uuidv4 dependency
      }

      // 3. Session get flow (no specific trigger or only token available)
      // If token has jti, it's likely valid; otherwise, might be initial empty token
      logger.debug({ trigger, correlationId }, '[JWT Callback] Session get/refresh flow');
      if (!token.jti) {
        // Ensure JTI exists even on initial empty token creation
        token.jti = uuidv4();
        logger.debug({ correlationId }, '[JWT Callback] Added missing JTI');
      }
      return token; // Return unmodified token for session checks
    },
  },
  events: {
    ...sharedAuthConfig.events,
  },
};

// Initialize NextAuth with the final configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode);
