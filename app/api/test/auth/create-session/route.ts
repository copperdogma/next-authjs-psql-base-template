import { NextRequest, NextResponse } from 'next/server';
// import { logger } from '@/lib/logger'; // Unused
import { initializeFirebaseAdminApp } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
// import { cookies } from 'next/headers'; // Unused
import { jwtDecode } from 'jwt-decode';
// import { UserRole } from "@/types"; // Unused
import { createContextLogger } from '@/lib/services/logger-service';
// import { v4 as uuidv4, validate as validateUUID } from 'uuid'; // Unused
// import * as admin from 'firebase-admin'; // Unused
import { randomUUID } from 'crypto';
import { User } from '@prisma/client'; // Import User type
// Import the auth namespace for types
import { auth } from 'firebase-admin';

// Initialize logger with a unique name for this route
const routeLogger = createContextLogger('api-test-create-session');

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days in seconds (Auth.js default)

// Type for the decoded Firebase custom token payload
interface DecodedFirebaseToken {
  uid: string;
  // Add other claims if needed, e.g., iat, exp, aud, iss, sub
}

// Helper function to decode the custom token
function decodeCustomToken(customToken: string): DecodedFirebaseToken {
  try {
    const decoded = jwtDecode<DecodedFirebaseToken>(customToken);
    if (!decoded || typeof decoded.uid !== 'string') {
      throw new Error('Invalid customToken payload: UID missing or not a string');
    }
    routeLogger.info(
      { uid: decoded.uid },
      `[API ${endpointPath}] Custom token decoded successfully.`
    );
    return decoded;
  } catch (decodeError: unknown) {
    const errorMessage = decodeError instanceof Error ? decodeError.message : String(decodeError);
    routeLogger.error(
      { err: decodeError, tokenSnippet: customToken.substring(0, 20) },
      `[API ${endpointPath}] Error decoding customToken.`
    );
    // Re-throw a specific error type or just the message for the main handler to catch
    throw new Error(`Invalid customToken format: ${errorMessage}`);
  }
}

// Helper to fetch Firebase user info
async function _fetchFirebaseUserInfo(uid: string, adminAuth: auth.Auth): Promise<auth.UserRecord> {
  try {
    const firebaseUserInfo = await adminAuth.getUser(uid);
    routeLogger.info({ uid }, `[API ${endpointPath}] Fetched user info from Firebase.`);
    return firebaseUserInfo;
  } catch (fbError) {
    routeLogger.error(
      { err: fbError, uid },
      `[API ${endpointPath}] Failed to fetch Firebase user info.`
    );
    throw new Error(`Failed to get Firebase user details for UID: ${uid}`);
  }
}

// Helper to create Prisma user
async function _createPrismaUser(uid: string, firebaseUserInfo: auth.UserRecord): Promise<User> {
  try {
    const user = await prisma.user.create({
      data: {
        id: uid,
        email: firebaseUserInfo.email,
        name: firebaseUserInfo.displayName || firebaseUserInfo.email?.split('@')[0],
        image: firebaseUserInfo.photoURL,
        role: 'USER', // Default role
        emailVerified: firebaseUserInfo.emailVerified ? new Date() : null,
      },
    });
    routeLogger.info({ uid: user.id }, `[API ${endpointPath}] User created successfully in DB.`);
    return user;
  } catch (creationError) {
    routeLogger.error(
      { err: creationError, uid },
      `[API ${endpointPath}] Failed to create user in DB.`
    );
    throw creationError;
  }
}

// Helper function to find or create the user in Prisma
async function findOrCreatePrismaUser(uid: string, adminAuth: auth.Auth): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { id: uid },
  });

  if (existingUser) {
    routeLogger.info({ uid: existingUser.id }, `[API ${endpointPath}] Found existing user in DB.`);
    return existingUser;
  }

  routeLogger.info({ uid }, `[API ${endpointPath}] User not found in DB, creating...`);
  const firebaseUserInfo = await _fetchFirebaseUserInfo(uid, adminAuth);
  return _createPrismaUser(uid, firebaseUserInfo);
}

// Helper function to create the session in Prisma
async function createPrismaSession(userId: string): Promise<string> {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  routeLogger.info({ userId }, `[API ${endpointPath}] Creating session in DB...`);
  try {
    await prisma.session.create({
      data: {
        sessionToken: sessionToken,
        userId: userId,
        expires: expires,
      },
    });
    routeLogger.info(
      { userId, sessionToken },
      `[API ${endpointPath}] Session created successfully.`
    );
    return sessionToken;
  } catch (error) {
    routeLogger.error(
      { err: error, userId },
      `[API ${endpointPath}] Failed to create session in DB.`
    );
    throw error; // Let the main handler catch this
  }
}

// Helper function to set the session cookie
function setSessionCookie(response: NextResponse, sessionToken: string): void {
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const cookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    expires: expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  routeLogger.info({ cookieName }, `[API ${endpointPath}] Session cookie set.`);
}

// Helper to validate and extract token from request
async function _validateAndExtractToken(req: NextRequest): Promise<string> {
  const { customToken } = await req.json();
  if (!customToken || typeof customToken !== 'string') {
    routeLogger.warn(`[API ${endpointPath}] Missing or invalid customToken.`);
    throw new Error('Missing or invalid customToken');
  }
  return customToken;
}

// Helper to build the success response
function _buildSuccessResponse(user: User, sessionToken: string): NextResponse {
  const response = NextResponse.json(
    { success: true, uid: user.id, sessionToken: sessionToken },
    { status: 200 }
  );
  setSessionCookie(response, sessionToken);
  routeLogger.info(`[API ${endpointPath}] Request processed successfully.`);
  return response;
}

// Helper to build an error response
function _buildErrorResponse(error: unknown): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  routeLogger.error(
    { err: error },
    `[API ${endpointPath}] Error processing request: ${errorMessage}`
  );

  // Tailor status code based on error type
  if (
    errorMessage.startsWith('Invalid customToken') ||
    errorMessage.startsWith('Missing or invalid customToken')
  ) {
    return NextResponse.json({ message: errorMessage }, { status: 401 });
  }
  // Add more specific error handling if needed (e.g., database errors)

  return NextResponse.json({ message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
}

/**
 * Processes the main logic for creating a session after initial checks.
 * @param req - The NextRequest object.
 * @param adminAuth - Initialized Firebase Admin Auth instance.
 * @returns NextResponse with success or error details.
 */
async function _processSessionCreationRequest(
  req: NextRequest,
  adminAuth: auth.Auth
): Promise<NextResponse> {
  try {
    // 1. Validate and Get Token
    const customToken = await _validateAndExtractToken(req);

    // 2. Decode Token & Find/Create User
    const decodedToken = decodeCustomToken(customToken);
    const user = await findOrCreatePrismaUser(decodedToken.uid, adminAuth);

    // 3. Create Session
    const sessionToken = await createPrismaSession(user.id);

    // 4. Build and Send Success Response
    return _buildSuccessResponse(user, sessionToken);
  } catch (error: unknown) {
    // 5. Build and Send Error Response
    return _buildErrorResponse(error);
  }
}

const endpointPath = '/api/test/auth/create-session';

/**
 * POST handler for creating a session from a Firebase Custom Token during E2E tests.
 * Accepts a customToken, decodes it to get UID, finds/creates user, creates session.
 * THIS ROUTE SHOULD ONLY BE ACTIVE IN THE TEST ENVIRONMENT.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Added return type
  routeLogger.info(`[API ${endpointPath}] Received POST request`);

  // Environment Check
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    routeLogger.warn(`[API ${endpointPath}] Attempted access outside allowed environment.`);
    return new NextResponse('Not Found', { status: 404 });
  }
  routeLogger.info(`[API ${endpointPath}] Test endpoint allowed.`);

  // Admin SDK Initialization
  let adminAuth: auth.Auth;
  try {
    const adminApp = initializeFirebaseAdminApp();
    adminAuth = adminApp.auth();
    routeLogger.info(`[API ${endpointPath}] Firebase Admin SDK initialized.`);
  } catch (initError: unknown) {
    const errorMessage = initError instanceof Error ? initError.message : String(initError);
    routeLogger.error(
      { err: initError },
      `[API ${endpointPath}] Failed Admin SDK init: ${errorMessage}`
    );
    return NextResponse.json(
      { message: `Internal Server Error - Admin SDK init failed: ${errorMessage}` },
      { status: 500 }
    );
  }

  // Process the request using the helper function
  return _processSessionCreationRequest(req, adminAuth);
}
