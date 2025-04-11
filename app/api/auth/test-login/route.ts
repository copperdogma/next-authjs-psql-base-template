import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService, LoggerService } from '@/lib/interfaces/services';
import { defaultFirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api:auth:test-login');

/**
 * @swagger
 * /api/auth/test-login:
 *   get:
 *     tags:
 *       - Authentication
 *     description: Provides a test authentication form for E2E testing
 *     responses:
 *       200:
 *         description: An HTML form for test authentication
 *       404:
 *         description: Not found (in non-test environments)
 *   post:
 *     tags:
 *       - Authentication
 *     description: Handles test authentication for E2E tests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication success response with mock token
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Not found (in non-test environments)
 */
export async function GET() {
  // Basic HTML form for test authentication
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Login</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 500px; margin: 0 auto; }
          form { display: flex; flex-direction: column; gap: 1rem; }
          button { padding: 0.5rem; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>E2E Test Authentication</h1>
        <p>This endpoint is for E2E testing purposes only.</p>
        <form method="POST">
          <input name="email" placeholder="Email" value="test@example.com" />
          <input name="password" placeholder="Password" type="password" value="Test123!" />
          <button type="submit">Authenticate</button>
        </form>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

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
      { error: 'Test authentication is only available in test environment' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Creates a test login handler with dependency injection
 * @param firebaseAdminService - Service for Firebase Admin operations
 * @param logger - Logger service for recording login attempts and errors
 * @returns An async handler function to process test login requests
 */
export function createTestLogin(firebaseAdminService: FirebaseAdminService, logger: LoggerService) {
  return async function handleTestLogin(request: NextRequest) {
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

      return response;
    } catch (error: unknown) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Error in test login'
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to authenticate test user', details: errorMessage },
        { status: 500 }
      );
    }
  };
}

// Create handler function with dependencies
const testLoginHandler = createTestLogin(defaultFirebaseAdminService, logger);

// Export the handler
export async function POST(request: NextRequest) {
  return testLoginHandler(request);
}
