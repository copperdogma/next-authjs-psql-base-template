import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

/**
 * API endpoint to set up a test user for E2E tests
 * This is only available in test environments
 */
export async function GET() {
  // Only allow this endpoint in test environments
  if (process.env.NODE_ENV !== 'test' && !process.env.ALLOW_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'This endpoint is only available in test environments' },
      { status: 403 }
    );
  }

  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'Test123!';
  const testName = process.env.TEST_USER_DISPLAY_NAME || 'Test User';

  try {
    // Check if the test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
      });
    }

    // Create the test user if it doesn't exist
    const hashedPassword = await hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        hashedPassword, // Store the hashed password directly on the user
        // Create an account for the user with credentials provider
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: testEmail,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error setting up test user:', error);
    return NextResponse.json(
      { error: 'Failed to set up test user', details: String(error) },
      { status: 500 }
    );
  }
}
