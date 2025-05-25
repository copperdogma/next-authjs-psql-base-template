import { jest } from '@jest/globals';
import { User, Account } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { authConfigNode } from '@/lib/auth-node';
import { UserRole } from '@/types';
// Jest environment node is typically set via Jest config, but can be specified here if needed
// /**
//  * @jest-environment node
//  */
// import '@/lib/__mocks__/prisma';

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    $executeRaw: jest.fn().mockImplementation(() => Promise.resolve(1)),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock uuidv4
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4'),
}));

describe('JWT Callback LastSignedIn', () => {
  let mockToken: JWT;
  let mockUser: User;
  let mockAccount: Account;
  let mockPrisma: any;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken = {
      name: 'Test User',
      email: 'test@example.com',
      sub: 'user-123', // user ID
      jti: 'token-abc', // existing token ID
      iat: Math.floor(Date.now() / 1000), // issued at time
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // expiration time
      picture: null,
    };
    mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      role: UserRole.USER, // Add missing required field
    };
    mockAccount = {
      provider: 'credentials',
      type: 'credentials',
      providerAccountId: 'user-123',
    };
    mockPrisma = require('@/lib/prisma').prisma;
  });

  // Extract JWT callback from auth config
  const jwtCallback = authConfigNode.callbacks?.jwt;

  it('updates lastSignedInAt on sign-in', async () => {
    // Verify the JWT callback exists
    expect(jwtCallback).toBeDefined();

    if (!jwtCallback) {
      throw new Error('JWT callback is not defined');
    }

    // Call the callback with mock data
    const result = await jwtCallback({
      token: mockToken,
      user: mockUser,
      account: mockAccount,
      trigger: 'signIn',
    });

    // Verify token is returned with expected values
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        sub: 'user-123',
      })
    );

    // Verify SQL query was executed
    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);

    // Template literals come as arrays in the mock calls
    const sqlParts = mockPrisma.$executeRaw.mock.calls[0][0];
    expect(sqlParts[0]).toContain('UPDATE "User"');
    expect(sqlParts[0]).toContain('SET "lastSignedInAt" = NOW()');
    expect(sqlParts[0]).toContain('WHERE "id" =');
  });

  it('handles column not existing gracefully', async () => {
    // Mock the executeRaw to throw error simulating column not existing
    mockPrisma.$executeRaw.mockRejectedValueOnce(
      new Error('column "lastSignedInAt" does not exist')
    );

    // Verify the JWT callback exists
    expect(jwtCallback).toBeDefined();

    if (!jwtCallback) {
      throw new Error('JWT callback is not defined');
    }

    // Call the callback with mock data
    const result = await jwtCallback({
      token: mockToken,
      user: mockUser,
      account: mockAccount,
      trigger: 'signIn',
    });

    // Verify token is still returned despite error
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        sub: 'user-123',
      })
    );

    // Verify SQL query was attempted
    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);

    // Verify warning was logged
    const logger = require('@/lib/logger').logger;
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        error: expect.any(Error),
      }),
      expect.stringContaining('Error updating lastSignedInAt')
    );
  });
});
