import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { type NextRequest } from 'next/server';
import { loggers } from '@/lib/logger';
// Remove unused authConfig import
// import { authConfig } from '@/lib/auth';

const logger = loggers.api;

// IMPORTANT: This endpoint is intended ONLY for E2E testing environments.
// It bypasses standard authentication flows and should NEVER be exposed in production.
// Consider adding extra security like a secret header check if needed.

export async function POST(request: NextRequest) {
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    logger.warn(
      'Attempted access to test-only endpoint create-session without ALLOW_TEST_ENDPOINTS=true.'
    );
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { userId, email, name } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Use Firebase Admin SDK to create a custom token
    const firebaseAdmin = getFirebaseAdmin();
    const additionalClaims = {
      email: email || undefined, // Pass email/name if available
      name: name || undefined,
      // Add any other claims your app might rely on during initial session creation
    };
    const customToken = await firebaseAdmin.auth().createCustomToken(userId, additionalClaims);

    logger.info({ userId }, 'Firebase custom token created successfully via API.');

    // Return the custom token
    return NextResponse.json({ success: true, customToken }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'Error creating Firebase custom token via API');
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
