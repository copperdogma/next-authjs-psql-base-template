import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createLogger } from '@/lib/logger';
import { encode } from 'next-auth/jwt';

const logger = createLogger('api:test:auth');

// Ensure this endpoint is only available in test environments
const SECURE_COOKIE = process.env.NODE_ENV === 'production';

interface TestAuthRequestBody {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Checks if the request is authorized to access test endpoints
 */
function isTestEndpointAuthorized(request: NextRequest): {
  isAuthorized: boolean;
  response?: NextResponse;
} {
  if (!process.env.ALLOW_TEST_ENDPOINTS) {
    logger.warn({
      msg: 'Attempt to access test endpoint without ALLOW_TEST_ENDPOINTS set',
      headers: Object.fromEntries(request.headers),
    });
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { success: false, error: 'Test endpoints not enabled' },
        { status: 404 }
      ),
    };
  }

  return { isAuthorized: true };
}

/**
 * Verifies that Firebase emulator is being used
 */
function verifyEmulatorUsage(): { isEmulator: boolean; response?: NextResponse } {
  const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

  if (!usingEmulator) {
    logger.error({ msg: 'Refusing to create test user in PRODUCTION Firebase!' });
    return {
      isEmulator: false,
      response: NextResponse.json(
        { success: false, error: 'Firebase emulator not detected' },
        { status: 403 }
      ),
    };
  }

  return { isEmulator: true };
}

/**
 * Validates request body for required fields
 */
function validateRequestBody(data: unknown): {
  isValid: boolean;
  response?: NextResponse;
  body?: TestAuthRequestBody;
} {
  // Type guard to check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }

  // Cast to any to check for properties
  const body = data as Record<string, unknown>;

  if (
    !body.userId ||
    typeof body.userId !== 'string' ||
    !body.email ||
    typeof body.email !== 'string'
  ) {
    logger.warn({ msg: 'Missing required fields in test auth request' });
    return {
      isValid: false,
      response: NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      ),
    };
  }

  // Create properly typed body
  const validBody: TestAuthRequestBody = {
    userId: body.userId,
    email: body.email,
    name: typeof body.name === 'string' ? body.name : undefined,
  };

  return { isValid: true, body: validBody };
}

/**
 * Creates a Firebase custom token
 */
async function createFirebaseToken(userId: string, email: string): Promise<string> {
  const auth = getFirebaseAdmin().auth();
  logger.info({ msg: 'Creating custom token for test user', userId, email });
  return auth.createCustomToken(userId, { email });
}

/**
 * Creates a NextAuth JWT token
 */
async function createNextAuthToken(
  userId: string,
  email: string,
  name?: string
): Promise<string | null> {
  // Check for NextAuth secret
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    logger.error({ msg: 'NEXTAUTH_SECRET is not set' });
    return null;
  }

  logger.info({ msg: 'Creating NextAuth session token' });
  return encode({
    token: {
      name: name || 'Test User',
      email,
      picture: null,
      sub: userId,
    },
    secret: nextAuthSecret,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Configures the session cookie
 */
function getSessionCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    domain: 'localhost',
  };
}

/**
 * Creates a NextAuth session token and sets the cookie
 */
async function createSessionToken(
  userId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; response?: NextResponse; error?: string }> {
  try {
    // 1. Create Firebase custom token
    const customToken = await createFirebaseToken(userId, email);

    // 2. Create NextAuth token
    const token = await createNextAuthToken(userId, email, name);
    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        ),
      };
    }

    // 3. Set cookie in response
    const cookieName = SECURE_COOKIE
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const response = NextResponse.json({
      success: true,
      userId,
      email,
      customToken,
      usingEmulator: true,
    });

    logger.info({ msg: 'Setting session cookie', name: cookieName });
    response.cookies.set(cookieName, token, getSessionCookieOptions());

    return { success: true, response };
  } catch (error) {
    logger.error({
      msg: 'Error creating tokens',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates and processes the session request body
 */
async function validateAndExtractSessionData(requestBody: unknown): Promise<{
  isValid: boolean;
  response?: NextResponse;
  sessionData?: { userId: string; email: string; name?: string };
}> {
  // Validate request body
  const validation = validateRequestBody(requestBody);
  if (!validation.isValid || !validation.body) {
    // Use a default error response if validation.response is undefined
    return {
      isValid: false,
      response:
        validation.response ||
        NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 }),
    };
  }

  // Verify emulator usage
  const emulator = verifyEmulatorUsage();
  if (!emulator.isEmulator) {
    // Use a default error response if emulator.response is undefined
    return {
      isValid: false,
      response:
        emulator.response ||
        NextResponse.json(
          { success: false, error: 'Firebase emulator not detected' },
          { status: 403 }
        ),
    };
  }

  // Return the validated data
  return {
    isValid: true,
    sessionData: validation.body,
  };
}

/**
 * Creates an error response
 */
function createErrorResponse(error: unknown): NextResponse {
  logger.error({
    msg: 'Error creating test authentication session',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
}

/**
 * Processes the request body and creates a session token
 */
async function processCreateSessionRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate request and extract data
    const validation = await validateAndExtractSessionData(body);
    if (!validation.isValid || !validation.sessionData) {
      return validation.response || createErrorResponse('Invalid session data');
    }

    // 3. Create session token
    const { userId, email, name } = validation.sessionData;
    const result = await createSessionToken(userId, email, name);

    if (!result.success || !result.response) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return result.response;
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Logs environment state for debugging
 */
function logEnvironmentState(): void {
  logger.info({
    msg: 'Test auth session creation requested',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
      USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR,
      allowTestEndpoints: process.env.ALLOW_TEST_ENDPOINTS,
    },
  });
}

/**
 * Creates a test session via Firebase auth emulator
 *
 * POST /api/test/auth/create-session
 * Body: { userId, email, name }
 */
export async function POST(request: NextRequest) {
  // 1. Check authorization for test endpoint
  const auth = isTestEndpointAuthorized(request);
  if (!auth.isAuthorized) {
    return auth.response;
  }

  // 2. Log environment state for debugging
  logEnvironmentState();

  // 3. Process the request and create session
  return processCreateSessionRequest(request);
}
