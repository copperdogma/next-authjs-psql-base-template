import { createContextLogger } from '@/lib/services/logger-service';

// Remove unused logger import: import { logger } from '../logger';
// Remove unused FIREBASE_REST_API_URL constant

// Define interfaces for Firebase Auth REST API responses
interface FirebaseAuthSuccessResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered?: boolean;
  refreshToken: string;
  expiresIn: string;
  emailVerified?: boolean;
  // Add other potential fields if needed based on API docs
}

interface FirebaseAuthErrorData {
  code: number;
  message: string;
  errors?: { message: string; domain: string; reason: string }[];
}

interface FirebaseAuthErrorResponse {
  error: FirebaseAuthErrorData;
}

// Helper function to call the Firebase Auth REST API
// eslint-disable-next-line max-statements -- Function encapsulates the steps for making a Firebase Auth REST API call, including setup, execution, and basic error handling.
async function callFirebaseAuthApi(payload: object): Promise<FirebaseAuthSuccessResponse> {
  const logger = createContextLogger('callFirebaseAuthApi');
  // Use specific type
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY environment variable.');
  }

  const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(FIREBASE_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: FirebaseAuthSuccessResponse | FirebaseAuthErrorResponse = await response.json();

    if (!response.ok || 'error' in data) {
      const errorData = data as FirebaseAuthErrorResponse;
      const errorMessage = errorData?.error?.message || 'Unknown Firebase auth error';
      logger.error({ msg: 'Firebase Auth API Error', errorData });
      throw new Error(`Firebase Auth Error: ${errorMessage}`);
    }

    return data as FirebaseAuthSuccessResponse; // Contains idToken, refreshToken, expiresIn, localId, etc.
  } catch (error) {
    // Handle network errors or unexpected issues
    logger.error({ msg: 'Error calling Firebase Auth API', error });
    throw new Error(
      `Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verifies a user's email and password using the Firebase Auth REST API.
 * IMPORTANT: This should only be used in secure server-side environments.
 * Do NOT expose the Firebase API key directly to the client.
 *
 * @param email The user's email address.
 * @param password The user's password.
 * @returns An object containing user information (uid, email, etc.) if successful.
 * @throws Throws an error if verification fails or API key is missing.
 */
export async function verifyPassword(email: string, password: string) {
  const logger = createContextLogger('verifyPassword');
  logger.debug({ msg: 'Attempting password verification via REST API', email });

  if (!email || !password) {
    logger.warn({ msg: 'Email or password missing' });
    throw new Error('Email and password are required.');
  }

  const payload = {
    email,
    password,
    returnSecureToken: true, // Request ID token
  };

  try {
    const data = await callFirebaseAuthApi(payload);

    // Verification successful
    logger.info({ msg: 'Password verification successful', email, userId: data.localId });
    return {
      uid: data.localId,
      email: data.email,
      emailVerified: data.emailVerified || false,
      displayName: data.displayName || null,
      // Note: The REST API doesn't return roles or custom claims directly.
      // You would typically manage roles in your own database (e.g., Firestore/Prisma).
    };
  } catch (error) {
    logger.error({
      msg: 'Password verification failed',
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Re-throw the specific error from callFirebaseAuthApi or a generic one
    throw error instanceof Error ? error : new Error('Password verification failed.');
  }
}
