import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/services/api-logger-service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import pino from 'pino';

/**
 * Protected User Information GET Endpoint
 *
 * Returns non-sensitive information about the currently authenticated user.
 * Requires authentication - will return 401 if not authenticated.
 */
export const GET = withApiLogger(
  async (_request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    try {
      // Get current session
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user?.id) {
        logger.info('Unauthorized access attempt to user info endpoint');
        return NextResponse.json(
          { error: 'Unauthorized', message: 'You must be logged in to access this resource.' },
          { status: 401 }
        );
      }

      // Fetch user details from database (excluding sensitive fields)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastSignedInAt: true,
          // Explicitly NOT selecting hashedPassword
        },
      });

      // Handle case where user is not found in database
      if (!user) {
        logger.warn({ userId: session.user.id }, 'User found in session but not in database');
        return NextResponse.json(
          { error: 'UserNotFound', message: 'User not found in database.' },
          { status: 404 }
        );
      }

      // Return user data
      return NextResponse.json(user);
    } catch (error) {
      logger.error({ error }, 'Error fetching user information');
      return NextResponse.json(
        { error: 'ServerError', message: 'Failed to fetch user information' },
        { status: 500 }
      );
    }
  }
);
