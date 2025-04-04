import { NextRequest, NextResponse } from 'next/server';
import firebaseAdmin from '@/lib/firebase-admin';

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

export async function POST(request: NextRequest) {
  try {
    // Validate we're in a test environment
    if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_TEST_AUTH !== 'true') {
      return NextResponse.json(
        { error: 'Test authentication is only available in test environment' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email')?.toString() || 'test@example.com';

    // Create a custom token for the test user
    const customToken = await firebaseAdmin.auth().createCustomToken('test-user-id', {
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
    console.error('Error in test login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to authenticate test user', details: errorMessage },
      { status: 500 }
    );
  }
}
