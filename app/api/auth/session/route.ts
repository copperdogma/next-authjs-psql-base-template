import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import {
  createSessionCookie,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../../../lib/auth/session';

/**
 * Create a new session (POST)
 *
 * @param request - Request object containing Firebase ID token
 * @returns Response with session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body to get ID token
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // Verify the ID token
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }

    // Create session cookie with 1 hour expiration (default)
    const sessionCookie = await createSessionCookie(token);
    const cookieOptions = getSessionCookieOptions();

    // Create response
    const response = NextResponse.json({ status: 'success' }, { status: 200 });

    // Set the session cookie in the response
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      ...cookieOptions,
    });

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

/**
 * End the current session (DELETE)
 *
 * @returns Response indicating session was deleted
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the current session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      try {
        // Verify the session cookie to get user data
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        // If valid session, revoke user's refresh tokens
        if (decodedClaims?.uid) {
          await auth.revokeRefreshTokens(decodedClaims.uid);
        }
      } catch (error) {
        console.error('Error verifying session cookie:', error);
        // Continue to clear the cookie even if verification fails
      }
    }

    // Create response and clear the session cookie
    const response = NextResponse.json({ status: 'success' }, { status: 200 });

    // Get cookie options and modify for deletion
    const cookieOptions = getSessionCookieOptions();

    // Delete the cookie by setting maxAge to 0
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      maxAge: 0,
      path: cookieOptions.path,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
    });

    return response;
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

/**
 * Validate the current session (GET)
 *
 * @returns Response with session status and user data if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the session cookie to get user data
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

      return NextResponse.json({
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          displayName: decodedClaims.name,
          emailVerified: decodedClaims.email_verified,
        },
      });
    } catch (error) {
      console.error('Session cookie verification failed:', error);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
