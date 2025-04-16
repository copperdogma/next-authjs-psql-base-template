import { NextResponse } from 'next/server';

/**
 * Test API route that exposes Firebase configuration for debugging E2E tests
 * Only enabled when ALLOW_TEST_ENDPOINTS is set to true
 */
export async function GET(): Promise<NextResponse> {
  // Only allow this endpoint in test environments
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    return NextResponse.json(
      { error: 'Endpoint disabled in non-test environment' },
      { status: 404 }
    );
  }

  // Return Firebase emulator configuration for debugging
  return NextResponse.json({
    // Client-side configs
    clientConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
      authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
      firestoreEmulatorHost: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    },
    // Server-side configs
    serverConfig: {
      useEmulator: process.env.USE_FIREBASE_EMULATOR,
      authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    },
    // Test info
    testInfo: {
      testPort: process.env.TEST_PORT,
      baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL,
      allowTestEndpoints: process.env.ALLOW_TEST_ENDPOINTS,
    },
    // Node environment
    nodeEnv: process.env.NODE_ENV,
  });
}
