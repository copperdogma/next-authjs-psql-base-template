import { NextResponse } from 'next/server';

/**
 * API route to expose relevant Firebase configuration for OPTIONAL Firebase services integration.
 *
 * NOTE: This endpoint is NOT related to the core authentication system of this template,
 * which uses NextAuth.js with PostgreSQL. This endpoint only provides configuration for
 * optional Firebase services like Firestore, Storage, or Functions that you might want
 * to add to your application.
 *
 * IMPORTANT SECURITY NOTES:
 * 1. This endpoint is DISABLED BY DEFAULT and requires ALLOW_FIREBASE_CONFIG_ENDPOINT=true
 *    to be set in your environment variables.
 * 2. Never expose sensitive credentials like the private key here.
 * 3. This endpoint should NOT be accessible in production environments.
 */
export async function GET() {
  // Enhanced security check - requires explicit environment variable
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_FIREBASE_CONFIG_ENDPOINT !== 'true'
  ) {
    return NextResponse.json(
      {
        message: 'Forbidden: This endpoint is disabled by default and not available in production.',
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Firebase Configuration (Optional Integration)',
    clientConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
      authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    },
    // Server-side configs
    serverConfig: {
      useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR, // Use public flag
      authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key is intentionally omitted for security
    },
    // Node environment
    nodeEnv: process.env.NODE_ENV,
  });
}
