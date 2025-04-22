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
// import { randomUUID } from 'crypto'; // Unused
import { User } from '@prisma/client'; // Import User type
// Import the auth namespace for types
import { auth } from 'firebase-admin';
// --- REVERT: Remove JWT related imports ---
// import { encode, type JWTEncodeParams } from 'next-auth/jwt';
// import { UserRole } from '@/types';
// import crypto from 'crypto';

// Initialize logger with a unique name for this route
const endpointPath = '/api/test/auth/create-session'; // Define endpoint path for logging
const routeLogger = createContextLogger('api-test-create-session');

// --- REVERT: Remove unused constant ---
// const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days in seconds (Auth.js default)

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

// --- REVERT: Remove JWT encoding function ---
/*
async function createAndEncodeJwt(user: User): Promise<string> {
  // ... removed ...
}
*/

// --- REVERT: Remove cookie setting function ---
/*
function setJwtCookie(response: NextResponse, encodedJwt: string): void {
  // ... removed ...
}
*/

// Helper to validate and extract token from request
async function _validateAndExtractToken(req: NextRequest): Promise<string> {
  const { customToken } = await req.json();
  if (!customToken || typeof customToken !== 'string') {
    routeLogger.warn(`[API ${endpointPath}] Missing or invalid customToken.`);
    throw new Error('Missing or invalid customToken');
  }
  return customToken;
}

// --- REVERT: Simplify success response ---
// Don't need JWT anymore here.
function _buildSuccessResponse(user: User): NextResponse {
  const response = NextResponse.json(
    { success: true, uid: user.id }, // Just return success and UID
    { status: 200 }
  );
  // No need to set cookie here anymore
  return response;
}

// --- REVERT: Keep original error response helper ---
function _buildErrorResponse(error: unknown): NextResponse {
  let errorMessage = 'An unknown error occurred';
  let statusCode = 500;

  if (error instanceof Error) {
    errorMessage = error.message;
    // Customize status code based on error type if needed
    if (errorMessage.startsWith('Invalid customToken') || errorMessage.startsWith('Missing or invalid')) {
      statusCode = 400;
    }
    // Add more specific error checks if necessary
  }

  routeLogger.error(
    { error: errorMessage, status: statusCode },
    `[API ${endpointPath}] Error processing request.`
  );
  return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
}

// Main processing function
// --- REVERT: Simplify processing function --- (No JWT needed)
async function _processSessionCreationRequest(
  req: NextRequest,
  adminAuth: auth.Auth
): Promise<NextResponse> {
  try {
    const customToken = await _validateAndExtractToken(req);
    const decodedToken = decodeCustomToken(customToken);
    const user = await findOrCreatePrismaUser(decodedToken.uid, adminAuth);

    // No JWT creation or cookie setting needed here for the reverted logic
    routeLogger.info(
      { userId: user.id },
      `[API ${endpointPath}] Request processed successfully (no JWT/cookie set).`
    );
    return _buildSuccessResponse(user);
  } catch (error) {
    return _buildErrorResponse(error);
  }
}

// Main POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  routeLogger.info(`[API ${endpointPath}] Received POST request`);

  // Allow this endpoint only in non-production environments for security
  if (process.env.NODE_ENV === 'production') {
    routeLogger.warn(`[API ${endpointPath}] Attempted access in production environment. Denied.`);
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  // Check if test endpoints are explicitly allowed (additional safeguard)
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    routeLogger.warn(`[API ${endpointPath}] Test endpoint access is disabled (ALLOW_TEST_ENDPOINTS not true).`);
    return NextResponse.json({ error: 'Test endpoints disabled' }, { status: 403 });
  }

  routeLogger.info(`[API ${endpointPath}] Test endpoint allowed.`);

  try {
    // Correctly get the auth service from the initialized app
    const adminApp = initializeFirebaseAdminApp();
    const adminAuth = adminApp.auth();
    routeLogger.info(`[API ${endpointPath}] Firebase Admin SDK initialized.`);
    return await _processSessionCreationRequest(req, adminAuth);
  } catch (error) {
    routeLogger.error({ error }, `[API ${endpointPath}] Unhandled error during initialization or processing.`);
    return _buildErrorResponse(error);
  }
}
