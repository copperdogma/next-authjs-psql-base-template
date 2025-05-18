import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-edge'; // Import auth for GET handler

// Debug what NextResponse is when this module is loaded by Jest
// console.log('[ROUTE_DEBUG] Top of route.ts - typeof NextResponse:', typeof NextResponse);
// if (NextResponse) {
//   console.log('[ROUTE_DEBUG] Top of route.ts - typeof NextResponse.json:', typeof NextResponse.json);
// } else {
//   console.log('[ROUTE_DEBUG] Top of route.ts - NextResponse is undefined/null');
// }

import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { logger } from '@/lib/logger';
import { AUTH, HTTP_STATUS } from '@/tests/utils/test-constants'; // Using test constants for cookie name/duration, consider moving to app constants
// import { FirebaseError } from 'firebase-admin'; // REMOVED by linter fix for unused var
import { prisma } from '@/lib/prisma'; // ADD THIS - To use the mocked instance

// Get the initialized Firebase Admin App - This is now handled by FirebaseAdminService.getInstance
// const adminApp = getFirebaseAdminApp();
// Instantiate FirebaseAdminService using the static getInstance method
// const adminService = FirebaseAdminService.getInstance(logger);

// Define an interface for the expected request body for POST
interface SessionPostBody {
  token: string;
}

interface FirebaseErrorLike {
  code: string;
  message: string;
  // Can include other properties if they are consistently present and accessed
}

// Type guard to check if an error is FirebaseErrorLike
function isFirebaseErrorLike(error: unknown): error is FirebaseErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as FirebaseErrorLike).code === 'string' &&
    'message' in error &&
    typeof (error as FirebaseErrorLike).message === 'string'
  );
}

// Helper to specifically handle Firebase-like errors (duck-typed)
function handleFirebaseError(error: { code: string; message: string }): {
  httpStatus: number;
  clientMessage: string;
  errorCode: string;
} {
  const errorCode = error.code;
  let httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let clientMessage = `A Firebase service error occurred. Code: ${errorCode}`;

  if (errorCode.startsWith('auth/')) {
    httpStatus = HTTP_STATUS.UNAUTHORIZED;
    clientMessage = error.message; // Use Firebase's message for auth errors
  }
  return { httpStatus, clientMessage, errorCode };
}

// Helper to handle generic JavaScript errors
function handleGenericError(error: Error): { httpStatus: number; clientMessage: string } {
  let httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorMessage = error.message;

  if (
    errorMessage.includes('Invalid Firebase ID token') ||
    errorMessage.includes('verifyIdToken') ||
    errorMessage.includes('ID token has expired') ||
    errorMessage.includes('could not be verified')
  ) {
    httpStatus = HTTP_STATUS.UNAUTHORIZED;
  } else if (errorMessage.includes('DB session create error')) {
    // Retains 500, clientMessage is error.message by default
  } else if (errorMessage.includes('Session cookie creation failed')) {
    // Retains 500, clientMessage will be error.message
  }
  // Default clientMessage will be error.message if not overridden
  return { httpStatus, clientMessage: errorMessage };
}

// Helper function to handle errors during session creation
export function handleSessionCreationError(error: unknown): NextResponse {
  let httpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let clientMessage = 'An unexpected error occurred during session creation.';
  let errorCode: string | undefined;

  if (isFirebaseErrorLike(error)) {
    // Use the type guard
    const firebaseErrorResult = handleFirebaseError(error); // error is now narrowed to FirebaseErrorLike
    httpStatus = firebaseErrorResult.httpStatus;
    clientMessage = firebaseErrorResult.clientMessage;
    errorCode = firebaseErrorResult.errorCode;
  } else if (error instanceof SyntaxError) {
    httpStatus = HTTP_STATUS.BAD_REQUEST;
    clientMessage = 'Invalid request body: Malformed JSON.';
  } else if (error instanceof Error) {
    const genericErrorResult = handleGenericError(error);
    httpStatus = genericErrorResult.httpStatus;
    clientMessage = genericErrorResult.clientMessage; // Already set to error.message
  }

  logger.error(
    {
      err: error,
      errorCode,
      originalMessage: error instanceof Error ? error.message : String(error),
    },
    `Session POST: Error. Status: ${httpStatus}, ClientMsg: "${clientMessage}", OriginalMsg: "${error instanceof Error ? error.message : String(error)}"`
  );

  return NextResponse.json(
    {
      error: clientMessage,
      errorCode,
      originalErrorMessage: error instanceof Error ? error.message : String(error),
    },
    { status: httpStatus }
  );
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth(); // Get session using edge-compatible auth
    if (session) {
      return NextResponse.json(session, { status: HTTP_STATUS.OK });
    } else {
      return NextResponse.json(
        { message: 'No active session' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
  } catch (error: unknown) {
    logger.error({ err: error }, 'Session GET: Error fetching session');
    return NextResponse.json(
      {
        error: 'Failed to retrieve session',
        originalErrorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminService = FirebaseAdminService.getInstance(logger);
  try {
    // console.log('[ROUTE_DEBUG] POST handler started');
    // console.log('[ROUTE_DEBUG] POST: typeof request:', typeof request, 'request.json is func:', typeof request?.json === 'function');
    const body = (await request.json()) as SessionPostBody;
    // console.log('[ROUTE_DEBUG] POST after request.json()', body);

    if (!body || !body.token) {
      logger.warn('Session POST: Missing token in request body.');
      return NextResponse.json({ error: 'Token is required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    const { token: idToken } = body;
    const expiresIn = AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS * 1000; // ms

    // console.log('[ROUTE_DEBUG] POST before adminService.verifyIdToken');
    const decodedToken = await adminService.verifyIdToken(idToken, true);
    // console.log('[ROUTE_DEBUG] POST after adminService.verifyIdToken', decodedToken);
    const userId = decodedToken.uid;

    // console.log('[ROUTE_DEBUG] POST before prisma.user.findUnique');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // console.log('[ROUTE_DEBUG] POST after prisma.user.findUnique', user);

    if (!user) {
      logger.warn({ userId }, 'Session POST: User not found in database for session creation.');
      return NextResponse.json(
        { error: 'User not found in database for session creation.' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // console.log('[ROUTE_DEBUG] POST before prisma.session.create');
    // Prisma session creation for audit log or additional checks, not directly for NextAuth session cookie.
    await prisma.session.create({
      data: {
        userId: user.id,
        expires: new Date(Date.now() + expiresIn),
        sessionToken: 'placeholder-for-session-token', // This will be overwritten by actual session cookie value if needed for DB
      },
    });
    // console.log('[ROUTE_DEBUG] POST after prisma.session.create', _session);

    // console.log('[ROUTE_DEBUG] POST before adminService.createSessionCookie');
    const sessionCookie = await adminService.createSessionCookie(idToken, { expiresIn });
    // console.log('[ROUTE_DEBUG] POST after adminService.createSessionCookie', sessionCookie);

    // console.log('[ROUTE_DEBUG] POST success: typeof NextResponse.json:', typeof NextResponse?.json);
    const response = NextResponse.json(
      { status: 'success', message: 'Session created' },
      { status: HTTP_STATUS.OK }
    );
    response.cookies.set({
      name: AUTH.COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS,
    });

    logger.info('Session POST: Session cookie created successfully.');
    return response;
  } catch (error: unknown) {
    // console.log('[ROUTE_DEBUG] RAW ERROR IN CATCH - Type:', typeof error, 'Stringified:', String(error));
    // if (error instanceof Error) {
    //   console.log('[ROUTE_DEBUG] Error Name:', error.name, 'Msg:', error.message, 'Stack:', error.stack);
    // }
    // logger.error('POST HANDLER CAUGHT ERROR:', error); // This is too generic, handleSessionCreationError has better logging
    return handleSessionCreationError(error);
  }
}

export async function DELETE(_request: NextRequest): Promise<NextResponse> {
  // console.log('[ROUTE_DEBUG] DELETE handler started');
  try {
    // console.log('[ROUTE_DEBUG] DELETE: typeof NextResponse.json:', typeof NextResponse?.json);
    const response = NextResponse.json(
      { status: 'success', message: 'Session deleted' },
      { status: HTTP_STATUS.OK }
    );
    // console.log('[ROUTE_DEBUG] DELETE response created');

    response.cookies.set({
      name: AUTH.COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 0,
    });
    // console.log('[ROUTE_DEBUG] DELETE after cookies.set. Cookie name:', AUTH.COOKIE_NAME);

    return response;
  } catch (error: unknown) {
    // console.log('[ROUTE_DEBUG] RAW ERROR IN DELETE CATCH - Type:', typeof error, 'Stringified:', String(error));
    logger.error({ error }, 'Error in DELETE /api/auth/session');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
