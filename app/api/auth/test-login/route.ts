import { NextRequest, NextResponse } from 'next/server';
import { LoggerService } from '@/lib/interfaces/services';
import { firebaseAdminService } from '@/lib/server/services';
import { withApiLogger } from '@/lib/services/api-logger-service';
import { createTestLogin, validateTestEnvironment } from './service';

/**
 * @swagger
 * /api/auth/test-login:
 *   get:
 *     summary: Displays a test login form
 *     description: |
 *       Shows a simple HTML form that can be used during testing to log in with
 *       test credentials. This endpoint is only available in test environments.
 *     responses:
 *       200:
 *         description: HTML Login form
 *   post:
 *     summary: Authenticates a test user for testing purposes
 *     description: |
 *       Creates an authentication token for a test user that can be used in tests.
 *       This endpoint is only available in test environments or when specifically
 *       enabled via the ALLOW_TEST_AUTH environment variable.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for the test user
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: Custom Firebase auth token
 *       403:
 *         description: Test authentication not allowed in this environment
 *       404:
 *         description: Not found (in non-test environments)
 */

/**
 * Test authentication form endpoint
 */
export const GET = withApiLogger(async (_request: NextRequest, logger: LoggerService) => {
  logger.debug('Serving test login form');

  // Validate test environment
  const environmentError = validateTestEnvironment(logger);
  if (environmentError) {
    return environmentError;
  }

  // Basic HTML form for test authentication
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Authentication</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; max-width: 400px; margin: 0 auto; }
          h1 { color: #333; }
          form { display: flex; flex-direction: column; }
          input { margin-bottom: 1rem; padding: 0.5rem; }
          button { padding: 0.5rem; background: #0070f3; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Test Authentication</h1>
        <p>This form is only available in test environments.</p>
        <form method="POST">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" value="test@example.com" required />
          <button type="submit">Authenticate Test User</button>
        </form>
      </body>
    </html>
  `;

  logger.debug('Rendered test login form');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
});

/**
 * Test authentication handler
 */
export const POST = withApiLogger(async (request: NextRequest, logger: LoggerService) => {
  // Use the createTestLogin function, injecting the singleton firebaseAdminService
  const testLoginHandler = createTestLogin(firebaseAdminService, logger);
  return testLoginHandler(request);
});
