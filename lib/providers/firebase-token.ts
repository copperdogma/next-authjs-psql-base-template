import CredentialsProvider from 'next-auth/providers/credentials';
import { initializeFirebaseAdminApp } from '@/lib/firebase-admin'; // Corrected path
import { prisma } from '@/lib/prisma'; // Corrected path
import { logger } from '@/lib/logger'; // Corrected path
import type { User as NextAuthUser } from 'next-auth'; // Import NextAuth User type

// Custom error class to mimic CredentialsSignin error structure
class FirebaseAuthorizationError extends Error {
  // Declare the 'type' property explicitly
  type: string;

  constructor(message: string) {
    super(message);
    this.type = 'CredentialsSignin'; // Mimic credentials signin error type for consistency
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
  // eslint-disable-next-line complexity
  async authorize(credentials): Promise<NextAuthUser | null> {
    const log = logger.child({ provider: 'FirebaseTokenProvider' });
    const idToken = credentials?.idToken;

    if (!idToken || typeof idToken !== 'string') { // Add type check for idToken
      log.warn('Authorize failed: No valid idToken provided.');
      throw new FirebaseAuthorizationError('No Firebase ID Token provided.');
    }

    try {
      // 1. Verify the ID token using Firebase Admin SDK (against emulator)
      const adminApp = initializeFirebaseAdminApp(); // Get initialized admin app
      const decodedToken = await adminApp.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      log.info({ uid }, 'Firebase ID token verified successfully.');

      // 2. Find the corresponding user in the Prisma database
      const prismaUser = await prisma.user.findUnique({
        where: { id: uid },
      });

      if (!prismaUser) {
        log.error({ uid }, 'Authorize failed: User found in Firebase Auth but not in Prisma DB. Global setup might be incomplete.');
         throw new FirebaseAuthorizationError('User not found in database. Ensure test setup is complete.');
      }

      log.info({ userId: prismaUser.id }, 'User found in Prisma DB.');
      // 3. Return the user object mapping fields to NextAuth User type
      //    Ensure all required fields for NextAuth User are present.
      //    NextAuth User typically requires id, name, email, image.
      return {
        id: prismaUser.id,
        name: prismaUser.name,
        email: prismaUser.email,
        image: prismaUser.image,
        // Assign role directly from Prisma user object
        role: prismaUser.role,
      };

    } catch (error: unknown) {
      const uidFromCredentials = typeof credentials?.idToken === 'string' ? 'token_provided' : 'no_token'; // Avoid logging potentially sensitive token

      // Type guard for Firebase Admin SDK errors (often have a .code property)
      const isFirebaseAdminError = (e: unknown): e is { code?: string; message: string } => {
        return typeof e === 'object' && e !== null && 'message' in e;
      };

      // Catch specific Firebase errors if possible, otherwise log the generic error
      if (error instanceof FirebaseAuthorizationError) {
          log.error({ uid: uidFromCredentials, err: error.message }, 'Firebase authorization failed.');
          throw error; // Re-throw the custom error
      } else if (isFirebaseAdminError(error) && error.code?.startsWith('auth/')) {
        // Handle Firebase Admin SDK verification errors
        log.error({ uid: uidFromCredentials, firebaseErrorCode: error.code, err: error.message }, 'Firebase ID token verification failed.');
         throw new FirebaseAuthorizationError(`Firebase token verification failed: ${error.message}`);
      } else {
        // Handle other errors (e.g., Prisma connection issues, or unknown structure)
         const errorMessage = isFirebaseAdminError(error) ? error.message : 'An unknown error occurred';
        log.error({ err: error, message: errorMessage }, 'Authorize failed due to an unexpected error.');
        throw new FirebaseAuthorizationError(`An unexpected error occurred during authorization: ${errorMessage}`);
      }
    }
  },
});

// Optional export
// export default FirebaseTokenProvider; 