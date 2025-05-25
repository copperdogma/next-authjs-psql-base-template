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
import { getFirebaseAdminService } from '@/lib/server/services'; // Import the getter

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
function handleSessionCreationError(error: unknown): NextResponse {
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

interface SessionCreationServices {
  adminService: FirebaseAdminService;
  prismaClient: typeof prisma;
  loggerInstance: typeof logger;
}

async function _createSessionAndGetResponse(
  idToken: string,
  expiresIn: number,
  services: SessionCreationServices
): Promise<NextResponse> {
  const { adminService, prismaClient, loggerInstance } = services;

  const decodedToken = await adminService.verifyIdToken(idToken, true);
  const userId = decodedToken.uid;

  const user = await prismaClient.user.findUnique({ where: { id: userId } });
  if (!user) {
    loggerInstance.warn(
      { userId },
      'Session POST (_createSessionAndGetResponse): User not found in DB.'
    );
    return NextResponse.json(
      { error: 'User not found in database for session creation.' },
      { status: HTTP_STATUS.NOT_FOUND }
    );
  }

  // Placeholder Prisma session creation
  await prismaClient.session.create({
    data: {
      userId: user.id,
      expires: new Date(Date.now() + expiresIn),
      sessionToken: 'placeholder-for-session-token',
    },
  });

  const sessionCookie = await adminService.createSessionCookie(idToken, { expiresIn });
  const response = NextResponse.json(
    { status: 'success', message: 'Session created' },
    { status: HTTP_STATUS.OK }
  );
  response.cookies.set({
    name: AUTH.COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS,
  });
  return response;
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
  try {
    // const adminService = await FirebaseAdminService.getInstance(logger); // Old way
    const adminService = await getFirebaseAdminService(); // New way

    if (!adminService) {
      logger.error('Session POST: FirebaseAdminService not available.');
      return NextResponse.json(
        { error: 'Authentication service is currently unavailable.' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const body = (await request.json()) as SessionPostBody;

    if (!body || !body.token) {
      logger.warn('Session POST: Missing token in request body.');
      return NextResponse.json({ error: 'Token is required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    const { token: idToken } = body;
    const expiresIn = AUTH.SESSION_COOKIE_EXPIRES_IN_SECONDS * 1000; // ms

    return await _createSessionAndGetResponse(idToken, expiresIn, {
      adminService,
      prismaClient: prisma, // Pass the imported prisma directly
      loggerInstance: logger, // Pass the imported logger directly
    });
  } catch (error) {
    // Errors from _createSessionAndGetResponse (e.g., verifyIdToken, createSessionCookie) will be caught here
    // as will errors from request.json() or if the helper itself throws an unexpected error.
    return handleSessionCreationError(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const currentFunctionName = DELETE.name;
  const loggerInstance = logger.child({
    handler: currentFunctionName,
  });

  try {
    loggerInstance.info('Attempting to delete session cookie');
    const sessionCookie = request.cookies.get(AUTH.COOKIE_NAME);

    if (!sessionCookie) {
      loggerInstance.warn('No session cookie found to delete.');
      const response = NextResponse.json(
        { status: 'success', message: 'No active session to delete.' },
        { status: HTTP_STATUS.OK }
      );
      // Assuming COMMON_COOKIE_CONFIG_DELETE is correctly defined and imported in actual SUT code
      // For now, using an approximation of its likely values if it were available
      response.cookies.set({
        name: AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    loggerInstance.info({ cookieName: AUTH.COOKIE_NAME }, 'Session cookie found, clearing it.');
    const response = NextResponse.json(
      { status: 'success', message: 'Session deleted' },
      { status: HTTP_STATUS.OK }
    );
    // Assuming COMMON_COOKIE_CONFIG_DELETE is correctly defined and imported
    response.cookies.set({
      name: AUTH.COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (err: unknown) {
    loggerInstance.error(
      {
        error: err,
        originalErrorMessage: err instanceof Error ? err.message : String(err),
      },
      `Error in ${currentFunctionName} /api/auth/session`
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Only export what's needed for tests
if (process.env.NODE_ENV === 'test') {
  // Export additional functions for testing
  exports.handleSessionCreationError = handleSessionCreationError;
}
