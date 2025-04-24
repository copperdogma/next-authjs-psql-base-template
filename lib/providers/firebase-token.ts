import CredentialsProvider from 'next-auth/providers/credentials';
import { initializeFirebaseAdminApp } from '@/lib/firebase-admin'; // Corrected path
import { prisma } from '@/lib/prisma'; // Corrected path
import { logger } from '@/lib/logger'; // Corrected path
import type { User as NextAuthUser } from 'next-auth'; // Import NextAuth User type
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as pino from 'pino'; // Add pino import

// Custom error class to mimic CredentialsSignin error structure
class FirebaseAuthorizationError extends Error {
  // Declare the 'type' property explicitly
  type: string;

  constructor(message: string) {
    super(message);
    this.type = 'CredentialsSignin'; // Mimic credentials signin error type for consistency
  }
}

// Verifies token, finds user, and maps to NextAuthUser
async function verifyAndFetchUser(idToken: string, log: pino.Logger): Promise<NextAuthUser> {
  // 1. Verify the ID token
  const adminApp = initializeFirebaseAdminApp();
  const decodedToken = await adminApp.auth().verifyIdToken(idToken);
  const uid = decodedToken.uid;
  log.info({ uid }, 'Firebase ID token verified successfully.');

  // 2. Find the corresponding user in the Prisma database
  const prismaUser = await prisma.user.findUnique({
    where: { id: uid },
  });

  if (!prismaUser) {
    log.error({ uid }, 'Authorize failed: User found in Firebase Auth but not in Prisma DB.');
    throw new FirebaseAuthorizationError('User not found in database.');
  }

  log.info({ userId: prismaUser.id }, 'User found in Prisma DB.');

  // 3. Return the mapped user object
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    image: prismaUser.image,
    role: prismaUser.role,
  };
}

// Handles errors during the authorization process
function handleAuthorizeError(error: unknown, idTokenProvided: boolean, log: pino.Logger): never {
  const uidLogInfo = idTokenProvided ? 'token_provided' : 'no_token';

  // Type guard for Firebase Admin SDK errors
  const isFirebaseAdminError = (e: unknown): e is { code?: string; message: string } => {
    return typeof e === 'object' && e !== null && 'message' in e;
  };

  if (error instanceof FirebaseAuthorizationError) {
    log.error({ uid: uidLogInfo, err: error.message }, 'Firebase authorization failed internally.');
    throw error; // Re-throw the specific error
  } else if (isFirebaseAdminError(error) && error.code?.startsWith('auth/')) {
    log.error(
      { uid: uidLogInfo, firebaseErrorCode: error.code, err: error.message },
      'Firebase ID token verification failed.'
    );
    throw new FirebaseAuthorizationError(`Firebase token verification failed: ${error.message}`);
  } else if (error instanceof PrismaClientKnownRequestError) {
    log.error(
      { uid: uidLogInfo, prismaErrorCode: error.code, err: error.message },
      'Prisma database error during authorization.'
    );
    throw new FirebaseAuthorizationError('Database error during authorization.');
  } else {
    const errorMessage = isFirebaseAdminError(error) ? error.message : 'An unknown error occurred';
    log.error(
      { err: error, message: errorMessage },
      'Authorize failed due to an unexpected error.'
    );
    throw new FirebaseAuthorizationError(`An unexpected error occurred: ${errorMessage}`);
  }
}

export const FirebaseTokenProvider = CredentialsProvider({
  id: 'firebase-token', // Unique ID for this provider
  name: 'Firebase Token',
  credentials: {
    // Define the expected input credential(s)
    idToken: { label: 'Firebase ID Token', type: 'text' },
  },
  // Return type should be compatible with NextAuth User
  async authorize(credentials): Promise<NextAuthUser | null> {
    const log = logger.child({ provider: 'FirebaseTokenProvider' });
    const idToken = credentials?.idToken;
    const hasToken = !!idToken && typeof idToken === 'string';

    if (!hasToken) {
      log.warn('Authorize failed: No valid idToken provided.');
      // Use the error handler for consistency, even though we know the cause
      return handleAuthorizeError(
        new FirebaseAuthorizationError('No Firebase ID Token provided.'),
        false,
        log
      );
    }

    try {
      // Use the helper function for the core logic
      return await verifyAndFetchUser(idToken as string, log);
    } catch (error: unknown) {
      // Use the error handling helper function
      return handleAuthorizeError(error, true, log);
    }
  },
});

// Optional export
// export default FirebaseTokenProvider;
