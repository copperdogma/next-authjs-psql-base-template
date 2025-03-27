import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { SESSION_DURATION_MS } from '../../../../../lib/auth/token';
import { HttpStatusCode } from '../../../../../types/index';

/**
 * Refreshes a user's session with a new token
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: HttpStatusCode.BAD_REQUEST }
      );
    }

    // Verify the Firebase ID token
    await auth.verifyIdToken(token);

    // Create a new session cookie
    const sessionCookie = await auth.createSessionCookie(token, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Set the new session cookie with settings that work in both dev and production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const cookieOptions = {
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds for cookie
      httpOnly: true,
      secure: !isDevelopment, // Only use secure in production to allow HTTP in development
      path: '/',
      sameSite: isDevelopment ? 'lax' : ('none' as 'lax' | 'none'), // Use 'lax' in dev for HTTP, 'none' in prod
    };

    // Create response with cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error('Session refresh error:', error);

    // More detailed error handling
    let errorMessage = 'Unauthorized';
    let statusCode = HttpStatusCode.UNAUTHORIZED;

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('expired')) {
        errorMessage = 'Token has expired. Please sign in again.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid token. Please sign in again.';
      } else {
        statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        errorMessage = 'Session refresh failed';
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
