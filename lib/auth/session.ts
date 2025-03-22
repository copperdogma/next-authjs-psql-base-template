import { auth } from '../firebase-admin';
import { CookieSerializeOptions } from 'cookie';

// Constants for session management
export const DEFAULT_SESSION_EXPIRATION = 3600; // 1 hour in seconds
export const MAX_SESSION_EXPIRATION = 14 * 24 * 60 * 60; // 14 days in seconds
export const SESSION_COOKIE_NAME = 'session';

// Define a type that represents the decoded ID token
export interface DecodedIdToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss?: string;
  sub?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  auth_time?: number;
  [key: string]: any;
}

/**
 * Get cookie options for the session
 * @param expiresIn Expiration time in seconds (defaults to 1 hour)
 * @returns Cookie options object
 */
export const getSessionCookieOptions = (expiresIn = DEFAULT_SESSION_EXPIRATION): CookieSerializeOptions => {
  // Cap at maximum allowed value (14 days)
  const validExpiresIn = Math.min(expiresIn, MAX_SESSION_EXPIRATION);
  
  return {
    maxAge: validExpiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
};

/**
 * Create a session cookie from a Firebase ID token
 * @param idToken Firebase ID token
 * @param expiresIn Expiration time in seconds (defaults to 1 hour)
 * @returns Session cookie
 */
export const createSessionCookie = async (idToken: string, expiresIn = DEFAULT_SESSION_EXPIRATION): Promise<string> => {
  try {
    // Cap at maximum allowed value (14 days)
    const validExpiresIn = Math.min(expiresIn, MAX_SESSION_EXPIRATION);
    
    // Create the session cookie
    return await auth.createSessionCookie(idToken, { expiresIn: validExpiresIn * 1000 });
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    throw new Error('Failed to create session cookie');
  }
};

/**
 * Verify a session cookie
 * @param sessionCookie Session cookie to verify
 * @returns Decoded ID token
 */
export const verifySessionCookie = async (sessionCookie: string): Promise<DecodedIdToken> => {
  try {
    // Set checkRevoked to true to check if the session has been revoked
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error('Failed to verify session cookie:', error);
    throw new Error('Invalid session');
  }
};

/**
 * Revoke all sessions for a user
 * @param uid User ID
 * @returns Promise that resolves when sessions are revoked
 */
export const revokeAllSessions = async (uid: string): Promise<void> => {
  try {
    await auth.revokeRefreshTokens(uid);
  } catch (error) {
    console.error('Failed to revoke refresh tokens:', error);
    throw new Error('Failed to revoke sessions');
  }
}; 