import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { logger } from '@/lib/logger';
import { AUTH, HTTP_STATUS } from '@/tests/utils/test-constants'; // Using test constants for cookie name/duration, consider moving to app constants

// Define an interface for the expected request body for POST
interface SessionPostBody {
  token: string;
}

// Get the initialized Firebase Admin App - This is now handled by FirebaseAdminService.getInstance
// const adminApp = getFirebaseAdminApp();
// Instantiate FirebaseAdminService using the static getInstance method
const adminService = FirebaseAdminService.getInstance(logger);

// Helper function to handle errors during session creation
function handleSessionCreationError(error: unknown): NextResponse {
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  let httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let clientMessage = 'Could not create session cookie';

  if (error instanceof Error) {
    errorMessage = error.message;
    // Attempt to get a code if it exists (e.g., Firebase errors often have a .code property)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    ) {
      errorCode = (error as { code: string }).code;
    }
  }

  logger.error(
    { err: error, errorCode, originalMessage: errorMessage },
    `Session POST: Error creating session cookie. Code: ${errorCode}, Message: ${errorMessage}`
  );

  // Differentiate Firebase errors from general errors if possible
  if (typeof errorCode === 'string' && errorCode.startsWith('auth/')) {
    httpStatus = HTTP_STATUS.UNAUTHORIZED;
    clientMessage = 'Invalid token or Firebase error';
  } else if (error instanceof SyntaxError) {
    // SyntaxError is a subclass of Error
    httpStatus = HTTP_STATUS.BAD_REQUEST;
    clientMessage = 'Invalid request body';
  }

  return NextResponse.json({ error: clientMessage }, { status: httpStatus });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SessionPostBody;
    const idToken = body.token;

    if (!idToken) {
      logger.warn('Session POST: No token provided.');
      return NextResponse.json({ error: 'No token provided' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Verify the ID token and create a session cookie.
    // The session cookie will have the same JWT claims as the ID token.
    // Expires in 5 days (defined in AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS).
    const expiresIn = AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS * 1000; // ms

    // Verify the ID token. This will also check if the token is revoked.
    // Throws an error if the token is invalid.
    await adminService.verifyIdToken(idToken);

    // Create session cookie
    const sessionCookie = await adminService.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set cookie policy for session cookie.
    const response = NextResponse.json({ status: 'success' }, { status: HTTP_STATUS.OK });
    response.cookies.set({
      name: AUTH.COOKIE_NAME, // 'session'
      value: sessionCookie,
      maxAge: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS, // seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax', // Recommended for session cookies
    });

    logger.info('Session POST: Session cookie created successfully.');
    return response;
  } catch (error: unknown) {
    return handleSessionCreationError(error);
  }
}

export async function DELETE(_request: NextRequest): Promise<NextResponse> {
  try {
    // Clear the session cookie by setting its Max-Age to 0.
    const response = NextResponse.json({ status: 'success' }, { status: HTTP_STATUS.OK });
    response.cookies.set({
      name: AUTH.COOKIE_NAME, // 'session'
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    logger.info('Session DELETE: Session cookie cleared.');
    return response;
  } catch (error: unknown) {
    let message = 'An unexpected error occurred while clearing the session cookie.';
    if (error instanceof Error) {
      message = error.message;
    }
    logger.error(
      { err: error },
      `Session DELETE: Error clearing session cookie. Message: ${message}`
    );
    return NextResponse.json(
      { error: 'Could not clear session cookie' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
