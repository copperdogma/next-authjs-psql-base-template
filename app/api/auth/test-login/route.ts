import { NextResponse } from 'next/server';
import firebaseAdmin from '@/lib/firebase-admin';
import { loggers } from '@/lib/logger';

const logger = loggers.auth;

/**
 * @swagger
 * /api/auth/test-login:
 *   get:
 *     tags:
 *       - Authentication
 *     description: Returns a custom Firebase authentication token for E2E testing
 *     responses:
 *       200:
 *         description: JSON object with a custom Firebase authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  // Only allow this endpoint in test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in test environments' },
      { status: 403 }
    );
  }

  try {
    logger.info('Creating custom token for test user');

    // Use test user from environment or fallback to default
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testUid = process.env.TEST_USER_UID || 'test-user-123';
    const auth = firebaseAdmin.auth();

    // Try to find user by email first
    let customToken, uid, email;
    try {
      const userRecord = await auth.getUserByEmail(testEmail);
      customToken = await auth.createCustomToken(userRecord.uid);
      uid = userRecord.uid;
      email = userRecord.email;
      logger.info('Created custom token for existing user', { uid });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If user not found, use default UID
      logger.warn(`Couldn't find user by email ${testEmail}, using default UID instead`);
      customToken = await auth.createCustomToken(testUid);
      uid = testUid;
      email = testEmail;
      logger.info('Created custom token with default UID', { uid });
    }

    return NextResponse.json({ customToken, uid, email });
  } catch (err) {
    logger.error('Error creating custom token', { error: err });
    return NextResponse.json({ error: 'Failed to create authentication token' }, { status: 500 });
  }
}
