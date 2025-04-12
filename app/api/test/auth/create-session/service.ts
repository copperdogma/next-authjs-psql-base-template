import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService, LoggerService } from '@/lib/interfaces/services';
import { encode } from 'next-auth/jwt';

// Ensure this endpoint is only available in test environments
const SECURE_COOKIE = process.env.NODE_ENV === 'production';

interface TestAuthRequestBody {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Service for authorization checks
 */
export function createAuthorizationService(logger: LoggerService) {
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

  return {
    isTestEndpointAuthorized,
    verifyEmulatorUsage,
  };
}

/**
 * Service for request validation
 */
export function createValidationService(logger: LoggerService) {
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

  return {
    validateRequestBody,
  };
}

/**
 * Service for Firebase token operations
 */
export function createFirebaseTokenService(
  firebaseAdminService: FirebaseAdminService,
  logger: LoggerService
) {
  /**
   * Creates a Firebase custom token
   */
  async function createFirebaseToken(userId: string, email: string): Promise<string> {
    const auth = firebaseAdminService.auth();
    logger.info({ msg: 'Creating custom token for test user', userId, email });
    return auth.createCustomToken(userId, { email });
  }

  return { createFirebaseToken };
}

/**
 * Service for NextAuth token operations
 */
export function createNextAuthTokenService(logger: LoggerService) {
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

  return { createNextAuthToken };
}

/**
 * Service for session cookie operations
 */
export function createSessionCookieService(logger: LoggerService) {
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
   * Creates response with session cookie
   */
  function createSessionResponse(
    userId: string,
    email: string,
    token: string,
    customToken: string
  ): NextResponse {
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

    return response;
  }

  return {
    getSessionCookieOptions,
    createSessionResponse,
  };
}

/**
 * Service for token generation
 */
export function createTokenService(
  firebaseAdminService: FirebaseAdminService,
  logger: LoggerService
) {
  // Initialize sub-services
  const firebaseTokenService = createFirebaseTokenService(firebaseAdminService, logger);
  const nextAuthTokenService = createNextAuthTokenService(logger);
  const sessionCookieService = createSessionCookieService(logger);

  /**
   * Handles errors during token creation
   */
  function handleTokenError(error: unknown): { success: false; error: string } {
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
      const customToken = await firebaseTokenService.createFirebaseToken(userId, email);

      // 2. Create NextAuth token
      const token = await nextAuthTokenService.createNextAuthToken(userId, email, name);
      if (!token) {
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: 'Server configuration error' },
            { status: 500 }
          ),
        };
      }

      // 3. Set cookie in response and return
      const response = sessionCookieService.createSessionResponse(
        userId,
        email,
        token,
        customToken
      );
      return { success: true, response };
    } catch (error) {
      return handleTokenError(error);
    }
  }

  return {
    createFirebaseToken: firebaseTokenService.createFirebaseToken,
    createNextAuthToken: nextAuthTokenService.createNextAuthToken,
    getSessionCookieOptions: sessionCookieService.getSessionCookieOptions,
    createSessionToken,
  };
}

/**
 * Service for handling errors and responses
 */
export function createResponseService(logger: LoggerService) {
  /**
   * Creates a default validation error response
   */
  function createValidationErrorResponse(message = 'Invalid request body'): NextResponse {
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  /**
   * Creates a default emulator error response
   */
  function createEmulatorErrorResponse(): NextResponse {
    return NextResponse.json(
      { success: false, error: 'Firebase emulator not detected' },
      { status: 403 }
    );
  }

  /**
   * Creates an error response
   */
  function createErrorResponse(error: unknown): NextResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      msg: 'Error processing session request',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }

  return {
    createValidationErrorResponse,
    createEmulatorErrorResponse,
    createErrorResponse,
  };
}

/**
 * Service for validating session data
 */
export function createSessionValidationService(
  validationService: ReturnType<typeof createValidationService>,
  authService: ReturnType<typeof createAuthorizationService>,
  responseService: ReturnType<typeof createResponseService>,
  // Use underscore prefix for unused parameter to satisfy linter
  _logger: LoggerService
) {
  /**
   * Validates and processes the session request body
   */
  async function validateAndExtractSessionData(requestBody: unknown): Promise<{
    isValid: boolean;
    response?: NextResponse;
    sessionData?: { userId: string; email: string; name?: string };
  }> {
    // Validate request body
    const validation = validationService.validateRequestBody(requestBody);
    if (!validation.isValid || !validation.body) {
      return {
        isValid: false,
        response: validation.response || responseService.createValidationErrorResponse(),
      };
    }

    // Verify emulator usage
    const emulator = authService.verifyEmulatorUsage();
    if (!emulator.isEmulator) {
      return {
        isValid: false,
        response: emulator.response || responseService.createEmulatorErrorResponse(),
      };
    }

    // Extract session data
    const { userId, email, name } = validation.body;
    return {
      isValid: true,
      sessionData: { userId, email, name },
    };
  }

  return { validateAndExtractSessionData };
}

/**
 * Service for diagnostic logging
 */
export function createDiagnosticService(logger: LoggerService) {
  /**
   * Logs the environment state for debugging
   */
  function logEnvironmentState(): void {
    logger.info({
      envVars: {
        AUTH_EMULATOR_HOST: process.env.AUTH_EMULATOR_HOST || 'not set',
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || 'not set',
        USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR || 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SECRET SET]' : 'not set',
        TEST_EMAIL: process.env.TEST_USER_EMAIL ? '[EMAIL SET]' : 'not set',
        TEST_PASSWORD: process.env.TEST_USER_PASSWORD ? '[PASSWORD SET]' : 'not set',
      },
      msg: 'Auth service environment state',
    });
  }

  return { logEnvironmentState };
}

/**
 * Factory function for creating test auth service with dependency injection
 */
export function createTestAuthService(
  firebaseAdminService: FirebaseAdminService,
  logger: LoggerService
) {
  // Initialize sub-services
  const authService = createAuthorizationService(logger);
  const validationService = createValidationService(logger);
  const tokenService = createTokenService(firebaseAdminService, logger);
  const responseService = createResponseService(logger);
  const sessionValidationService = createSessionValidationService(
    validationService,
    authService,
    responseService,
    logger
  );
  const diagnosticService = createDiagnosticService(logger);

  /**
   * Creates token and processes the result
   */
  async function createTokenAndProcessResult(
    userId: string,
    email: string,
    name?: string
  ): Promise<NextResponse> {
    const result = await tokenService.createSessionToken(userId, email, name);

    if (!result.success) {
      return (
        result.response || responseService.createErrorResponse(result.error || 'Unknown error')
      );
    }

    return result.response as NextResponse;
  }

  /**
   * Processes a create session request
   */
  async function processCreateSessionRequest(request: NextRequest): Promise<NextResponse> {
    try {
      // Log environment state for debugging
      diagnosticService.logEnvironmentState();

      // Check if test endpoints are allowed
      const authorized = authService.isTestEndpointAuthorized(request);
      if (!authorized.isAuthorized) {
        return authorized.response as NextResponse;
      }

      // Validate the request body
      const requestBody = await request.json().catch(() => ({}));
      const validation = await sessionValidationService.validateAndExtractSessionData(requestBody);

      if (!validation.isValid || !validation.sessionData) {
        return validation.response as NextResponse;
      }

      // Create tokens and session
      const { userId, email, name } = validation.sessionData;
      return await createTokenAndProcessResult(userId, email, name);
    } catch (error) {
      return responseService.createErrorResponse(error);
    }
  }

  return {
    processCreateSessionRequest,
  };
}
