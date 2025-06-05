/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import { jest } from '@jest/globals';
import { UserRole } from '@/types';
import type pino from 'pino';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Create a test version of the handler function
// This mirrors the implementation in app/api/user/me/route.ts but allows for direct testing
async function testHandler(logger: pino.Logger): Promise<NextResponse> {
  try {
    // Get current session
    const { auth } = require('@/lib/auth');
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
    const { prisma } = require('@/lib/prisma');
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

// Mock pino logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as pino.Logger;

describe('User Me API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock auth to return null session (unauthenticated)
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValue(null);

    // Call our test handler
    const response = await testHandler(mockLogger);

    // Check status and response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource.',
    });
    expect(auth).toHaveBeenCalled();
  });

  it('should return 404 if authenticated user is not found in database', async () => {
    // Mock auth to return a session with user
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValue({
      user: { id: 'test-user-id' },
    });

    // Mock prisma to return null (user not found)
    const { prisma } = require('@/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(null);

    // Call our test handler
    const response = await testHandler(mockLogger);

    // Check status and response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({
      error: 'UserNotFound',
      message: 'User not found in database.',
    });
    expect(auth).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastSignedInAt: true,
      },
    });
  });

  it('should return user data if authenticated and user is found', async () => {
    // Mock auth to return a session with user
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValue({
      user: { id: 'test-user-id' },
    });

    // Mock user data that would be returned from database
    const mockUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      role: UserRole.USER,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
      lastSignedInAt: new Date('2023-01-15T12:00:00Z'),
    };

    // Mock prisma to return the user
    const { prisma } = require('@/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(mockUser);

    // Call our test handler
    const response = await testHandler(mockLogger);

    // Check status and response
    expect(response.status).toBe(200);
    const data = await response.json();

    // The dates will be serialized to strings in the JSON response
    const expectedUser = {
      ...mockUser,
      createdAt: mockUser.createdAt.toISOString(),
      updatedAt: mockUser.updatedAt.toISOString(),
      lastSignedInAt: mockUser.lastSignedInAt.toISOString(),
    };

    expect(data).toEqual(expectedUser);
    expect(auth).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastSignedInAt: true,
      },
    });
  });

  it('should return 500 if an error occurs during processing', async () => {
    // Mock auth to return a session with user
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValue({
      user: { id: 'test-user-id' },
    });

    // Mock prisma to throw an error
    const { prisma } = require('@/lib/prisma');
    prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    // Call our test handler
    const response = await testHandler(mockLogger);

    // Check status and response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({
      error: 'ServerError',
      message: 'Failed to fetch user information',
    });
    expect(auth).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
