import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '../../../../../lib/firebase-admin';
import { HttpStatusCode } from '../../../../../types/index';

/**
 * Endpoint to check if user has a valid session
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    // Log all cookies for debugging
    console.log('Session check - All cookies:', {
      cookies: Array.from(request.cookies.getAll()),
      count: request.cookies.getAll().length,
      headers: Object.fromEntries(request.headers),
    });

    if (!sessionCookie) {
      console.log('Session check - No session cookie found');
      return NextResponse.json({
        status: 'unauthenticated',
        authenticated: false,
      });
    }

    console.log('Session check - Found session cookie, verifying...', {
      cookiePrefix: sessionCookie.substring(0, 10) + '...',
      cookieLength: sessionCookie.length,
    });

    // Verify the session cookie
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      console.log('Session check - Session is valid for user:', decodedClaims.uid);

      return NextResponse.json({
        status: 'authenticated',
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
        },
      });
    } catch (verifyError) {
      console.error('Session check - Invalid session cookie:', verifyError);
      return NextResponse.json(
        {
          status: 'invalid_session',
          authenticated: false,
          error: 'Invalid session',
        },
        { status: HttpStatusCode.UNAUTHORIZED }
      );
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        authenticated: false,
        error: 'Internal server error',
      },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}
