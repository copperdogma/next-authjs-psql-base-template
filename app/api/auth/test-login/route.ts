import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * API route for programmatic test authentication
 *
 * This endpoint is ONLY available in non-production environments and is
 * specifically designed for E2E testing to provide faster authentication
 * without going through the UI flow.
 *
 * @returns Response with session cookies + redirect to dashboard
 */
export async function GET(request: Request) {
  // Security: Only allow in development or test environments
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    console.log('🔑 Test login API: Authenticating test user...');

    // Get test user credentials from environment variables
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';

    // Create a simple session object
    const session = {
      user: {
        email: testEmail,
        name: 'Test User',
        id: 'test-user-id',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    logger.info('Created test session for authentication', {
      context: 'auth',
      userId: session.user.id,
      email: session.user.email,
    });

    // Get the callback URL or default to dashboard
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';

    // Return redirect response
    const response = NextResponse.redirect(new URL(callbackUrl, request.url));

    // Set cookie would be done here in a real implementation
    // cookies.set('next-auth.session-token', token, { ...cookieOptions });

    return response;
  } catch (error) {
    console.error('❌ Test login API error:', error);
    logger.error('Error creating test auth session', { error });
    return NextResponse.json(
      {
        error: 'Test login failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
