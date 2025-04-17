import { v4 as uuidv4 } from 'uuid';

// Default test user information
const defaultTestUserId = 'test-user-id';
const defaultTestUserEmail = 'test@example.com';
const defaultTestUserName = 'Test User';

// Ensure NEXTAUTH_SECRET is available
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. This is required for signing test JWTs.'
  );
}

/**
 * Generates a JWT token for testing purposes, simulating a NextAuth session.
 * Uses the NEXTAUTH_SECRET environment variable for signing.
 *
 * @param userId - Optional user ID for the token payload. Defaults to a test ID.
 * @param email - Optional user email. Defaults to a test email.
 * @param name - Optional user name. Defaults to a test name.
 * @param expiresOffsetSeconds - Optional offset in seconds for token expiry. Defaults to 1 hour.
 * @returns A signed JWT token string.
 */
export async function generateTestSessionToken(
  userId: string = defaultTestUserId,
  email: string = defaultTestUserEmail,
  name: string = defaultTestUserName,
  expiresOffsetSeconds: number = 3600 // 1 hour default expiry
): Promise<string> {
  // Dynamically import encode as it's an ES Module
  const { encode } = await import('next-auth/jwt');

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const expires = now + expiresOffsetSeconds; // Expiration time

  const tokenPayload = {
    sub: userId, // Standard JWT subject claim
    id: userId, // User ID
    email: email,
    name: name,
    picture: null, // Assuming no picture for test user
    iat: now, // Issued at timestamp
    exp: expires, // Expiration timestamp
    jti: uuidv4(), // JWT ID, unique identifier
  };

  try {
    const token = await encode({
      token: tokenPayload,
      secret: secret as string,
      salt: secret as string,
      maxAge: expiresOffsetSeconds,
    });
    return token;
  } catch (error) {
    console.error('Error encoding JWT for testing:', error);
    throw new Error('Failed to generate test session token.');
  }
}
