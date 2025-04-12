import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService, LoggerService } from '@/lib/interfaces/services';
import { defaultFirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { createErrorResponse } from '@/lib/services/api-logger-service';

/**
 * Validates if the current environment allows test authentication
 * @param logger - Logger service to record validation attempts
 * @returns NextResponse error if not in test environment, null if validation passes
 */
export function validateTestEnvironment(logger: LoggerService): NextResponse | null {
  if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_TEST_AUTH !== 'true') {
    logger.info(
      { environment: process.env.NODE_ENV },
      'Test authentication attempted in non-test environment'
    );
    return NextResponse.json(
      {
        error: 'ForbiddenError',
        message: 'Test authentication is only available in test environment',
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Creates a test login handler with dependency injection
 *
 * @param firebaseAdminService - Firebase Admin Service for authentication
 * @param logger - Logger service for logging
 * @returns Handler function for test login requests
 */
export function createTestLogin(
  firebaseAdminService: FirebaseAdminService = defaultFirebaseAdminService,
  logger: LoggerService
) {
  return async (request: NextRequest) => {
    try {
      // Validate test environment
      const environmentError = validateTestEnvironment(logger);
      if (environmentError) {
        return environmentError;
      }

      const formData = await request.formData();
      const email = formData.get('email')?.toString() || 'test@example.com';

      logger.info({ email }, 'Creating test authentication token');

      // Create a custom token for the test user
      const customToken = await firebaseAdminService.auth().createCustomToken('test-user-id', {
        email,
        testAuth: true,
      });

      // Create response with the token
      const response = NextResponse.json({
        success: true,
        token: customToken,
        user: {
          email,
          uid: 'test-user-id',
        },
      });

      // Set a cookie that will be used for authentication in tests
      response.cookies.set('firebase-auth-test', customToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });

      logger.info({ email }, 'Test authentication successful');
      return response;
    } catch (error: unknown) {
      logger.error(
        {
          error:
            error instanceof Error ? { message: error.message, name: error.name } : String(error),
        },
        'Error in test login'
      );

      // Use standardized error response
      const requestId = request.headers.get('x-request-id') || 'unknown';
      return createErrorResponse(error, requestId, 500);
    }
  };
}
