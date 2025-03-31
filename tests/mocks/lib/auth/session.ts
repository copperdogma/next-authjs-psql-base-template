/**
 * MOCK FILE for testing
 * This is a mock replacement for the removed Firebase auth session management
 */

import { SerializeOptions } from 'cookie';

// Session cookie config
export const SESSION_COOKIE_NAME = 'session';
export const DEFAULT_SESSION_EXPIRATION_SECONDS = 3600; // 1 hour in seconds
export const MAX_SESSION_EXPIRATION_SECONDS = 14 * 24 * 60 * 60; // 14 days in seconds

/**
 * Gets cookie options for session cookie based on environment
 */
export function getSessionCookieOptions(
  maxAge = DEFAULT_SESSION_EXPIRATION_SECONDS
): SerializeOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    maxAge,
    httpOnly: true,
    secure: isProduction,
    path: '/',
    sameSite: 'lax',
  };
}

/**
 * Mock function for creating session
 */
export async function createSessionCookie(
  idToken: string,
  expiresIn = DEFAULT_SESSION_EXPIRATION_SECONDS
): Promise<string> {
  // In the real implementation, this would call Firebase Admin to create a session cookie
  return `mock-session-cookie-${idToken}-${expiresIn}`;
}

/**
 * Mock function for verifying session
 */
export async function verifySessionCookie(sessionCookie: string) {
  // In the real implementation, this would call Firebase Admin to verify the session
  if (!sessionCookie || sessionCookie === 'invalid') {
    throw new Error('Invalid session cookie');
  }

  return {
    uid: 'mock-user-id',
    email: 'test@example.com',
  };
}

/**
 * Mock function for destroying session
 */
export function destroySessionCookie(): SerializeOptions {
  return {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  };
}
