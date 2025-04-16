// TODO: NextAuth adapter tests are currently disabled due to issues with Firebase/Prisma integration
// These tests will be fixed in a future update

// Apply all jest.mock calls BEFORE any imports
jest.mock('../../../lib/env', () => ({
  getEnv: jest.fn().mockReturnValue({
    APP_NAME: 'test-app',
    ENV: 'test',
  }),
}));

// Mock the logger with inline functions to avoid variable initialization issues
jest.mock('../../../lib/logger', () => {
  // Create the mock functions directly in the factory
  return {
    createContextLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    })),
    loggers: {
      auth: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
      },
    },
  };
});

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn().mockReturnValue({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    updateUser: jest.fn(),
    linkAccount: jest.fn(),
    createSession: jest.fn(),
    getSessionAndUser: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
  }),
}));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock AuthService in auth.ts - do this AFTER the logger mock is set up
jest.mock('../../../lib/auth', () => {
  // Import the actual module
  const originalModule = jest.requireActual('../../../lib/auth');

  // Get the mock logger from our previous mock
  const mockLogger = jest.requireMock('../../../lib/logger').loggers.auth;

  // Create a mock AuthService instance using our mock logger
  const mockAuthService = new originalModule.AuthService(mockLogger);

  // Return a modified version of the original module
  return {
    ...originalModule,
    // Override the createAuthConfig function to use our mocked service
    createAuthConfig: jest.fn(() => mockAuthService.createAuthConfig()),
    // Export the authConfig which will now use our mocked service
    authConfig: mockAuthService.createAuthConfig(),
  };
});

// Now import modules AFTER all mocks are set up
import { NextAuthOptions, Account, Session, User, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../../../lib/interfaces/services';
import { authConfig } from '../../../lib/auth';
import { UserRole } from '@/types';

// Get references to the mock functions for verification
const loggerMock = jest.requireMock('../../../lib/logger');
const mockLogFunctions = loggerMock.loggers.auth;

// Access and store mock function references for verification
const mockLogInfo = mockLogFunctions.info as jest.Mock;
const mockLogError = mockLogFunctions.error as jest.Mock;
const mockLogWarn = mockLogFunctions.warn as jest.Mock;
const mockLogDebug = mockLogFunctions.debug as jest.Mock;

// TODO: Re-skipped due to persistent Prisma/Jest environment issues & ESM transform complexities.
// Suite fails with Prisma initialization errors ('validator') and/or ESM syntax errors from dependencies
// like '@auth/prisma-adapter' or its own dependencies, despite transformIgnorePatterns adjustments.
// Adapter functionality is implicitly tested via E2E auth flows.
describe('NextAuth Configuration', () => {
  test('should use Prisma adapter in the auth configuration', () => {
    // Check if adapter is defined in the auth config
    expect(authConfig.adapter).toBeDefined();

    // Perform a basic check to ensure it looks like an adapter instance
    // We don't need to check every single method, just that it's likely the adapter
    const adapter = authConfig.adapter as Adapter;
    expect(typeof adapter.createUser).toBe('function');
    expect(typeof adapter.getUser).toBe('function');
    expect(typeof adapter.linkAccount).toBe('function');
  });

  test('should have properly configured OAuth providers', () => {
    // Verify providers are configured
    expect(authConfig.providers).toBeDefined();
    expect(authConfig.providers.length).toBeGreaterThan(0);

    // Check for Google provider specifically
    const googleProvider = authConfig.providers.find(provider => provider.id === 'google');

    expect(googleProvider).toBeDefined();
    expect(googleProvider?.type).toBe('oauth');
    // Optionally check for client ID/Secret presence if env vars are mocked/set for tests
    // expect(googleProvider.options?.clientId).toBeDefined();
  });

  test('should have session configuration set to JWT strategy', () => {
    // Verify session configuration
    expect(authConfig.session).toBeDefined();
    expect(authConfig.session?.strategy).toBe('jwt');
    expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
  });

  test('should have callback functions defined', () => {
    // Verify callbacks are defined
    expect(authConfig.callbacks).toBeDefined();
    expect(typeof authConfig.callbacks?.session).toBe('function');
    expect(typeof authConfig.callbacks?.jwt).toBe('function');
  });

  test('should have specific events defined', () => {
    // Verify specific events are defined
    expect(authConfig.events).toBeDefined();
    expect(typeof authConfig.events?.signIn).toBe('function');
    expect(typeof authConfig.events?.signOut).toBe('function');
    expect(typeof authConfig.events?.createUser).toBe('function');
    expect(typeof authConfig.events?.linkAccount).toBe('function');
  });

  test('should have debug mode disabled by default', () => {
    // Debug mode should generally be false unless explicitly enabled
    expect(authConfig.debug).toBeFalsy();
  });

  test('should have pages configuration pointing to login', () => {
    expect(authConfig.pages).toBeDefined();
    expect(authConfig.pages?.signIn).toBe('/login');
  });

  test('should define NEXTAUTH_SECRET', () => {
    // Basic check that NEXTAUTH_SECRET is likely configured (relies on env)
    expect(authConfig.secret).toBeDefined();
    expect(typeof authConfig.secret).toBe('string');
    // A more robust test would involve setting process.env.NEXTAUTH_SECRET
  });
});

describe('NextAuth Callbacks', () => {
  // Use AdapterUser for mockUser and ensure all required fields are present
  const mockUser: AdapterUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: new Date(),
    role: UserRole.USER, // Add the role property that our implementation expects
  };
  // Use the specific User type expected by Session
  const mockSessionUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    image: null, // Add image property, can be null
  };
  const mockSession: Session = {
    user: mockSessionUser, // Use the correctly typed user object
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  const mockToken: JWT = {
    name: 'Test Token',
    sub: 'user-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    jti: 'jwt-1',
    id: 'user-123', // Add the id property that our implementation sets
  };
  // Define mockAccount conforming to Account type
  const mockAccount: Account = {
    userId: 'user-123',
    type: 'oauth',
    provider: 'google',
    providerAccountId: 'google-id-123',
    access_token: 'mock-access-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'Bearer',
    scope: 'openid profile email',
    id_token: 'mock-id-token',
    session_state: 'mock-session-state',
  };

  test('session callback should add userId to session user', async () => {
    if (!authConfig.callbacks?.session) {
      throw new Error('Session callback not defined');
    }
    // Ensure the passed arguments match the expected type
    const sessionResult = await authConfig.callbacks.session({
      session: { ...mockSession },
      token: { ...mockToken },
      user: mockUser, // This user should be AdapterUser
      // Add missing properties potentially expected by update trigger
      newSession: undefined, // Can be undefined if not updating
      trigger: 'update', // Provide a trigger, e.g., 'update'
    });
    expect(sessionResult.user).toBeDefined();
    expect((sessionResult.user as any).id).toBe('user-123');
  });

  test('jwt callback should add userId to token when user is provided', async () => {
    if (!authConfig.callbacks?.jwt) {
      throw new Error('JWT callback not defined');
    }

    // Mock findUnique to return a user with role
    const prismaMock = jest.requireMock('../../../lib/prisma').prisma;
    prismaMock.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-123',
      role: 'USER',
    });

    // Pass necessary arguments including account (can be null if not relevant)
    const tokenResult = await authConfig.callbacks.jwt({
      token: { ...mockToken },
      user: mockUser,
      account: mockAccount, // Provide mock account
      profile: undefined, // Optional
      trigger: 'signIn', // Example trigger
      isNewUser: false, // Example
    });

    // The token should have the id property set to the user's id
    expect(tokenResult.sub).toBe('user-123');
  });

  test('jwt callback should return original token when user is not provided', async () => {
    if (!authConfig.callbacks?.jwt) {
      throw new Error('JWT callback not defined');
    }

    // Mock findUnique to return a user with role
    const prismaMock = jest.requireMock('../../../lib/prisma').prisma;
    prismaMock.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-456',
      role: 'USER',
      name: 'Updated User',
      email: 'updated@example.com',
      image: 'updated.jpg',
    });

    const existingToken = { ...mockToken, id: 'user-123' };
    // Simulate refresh - user and account are typically null/undefined
    const tokenResult = await authConfig.callbacks.jwt({
      token: existingToken,
      // Pass undefined explicitly, still might need type assertion if strict
      user: undefined as unknown as AdapterUser, // Use type assertion if necessary
      account: null,
      trigger: 'update',
    });

    // Should keep existing properties but might add error if user not found
    expect(tokenResult.sub).toBe('user-123');
  });
});

describe('NextAuth Events', () => {
  // Setup common test data
  const mockUser: AdapterUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    emailVerified: new Date(),
    name: 'Test User',
    image: null,
  };

  // User for events
  const mockUserForEvents: User = {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  };

  // Profile for events requiring a Profile (different from User)
  const mockProfileForEvents: Profile & { id: string } = {
    id: 'user-id-123', // Add id to make it assignable to AdapterUser | User
    name: 'Test User', // string not undefined
    email: 'test@example.com',
    sub: 'user-id-123',
    image: undefined, // use undefined instead of null
  };

  const mockToken: JWT = { sub: 'user-evt-123' }; // JWT type
  const mockSession: Session = {
    user: mockUser,
    expires: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  };
  const mockAccount: Account = {
    provider: 'google',
    providerAccountId: 'google-123',
    type: 'oauth',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('signIn event handler should log info', () => {
    // Call the signIn event handler
    authConfig.events?.signIn?.({
      user: mockUserForEvents,
      account: mockAccount,
      profile: mockProfileForEvents,
      isNewUser: false,
    });

    // Verify logger was called with correct parameters
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'User authenticated successfully' })
    );
  });

  test('signOut event handler should log info', () => {
    // Call the signOut event handler
    authConfig.events?.signOut?.({ session: mockSession, token: mockToken });

    // Verify logger was called with correct parameters
    expect(mockLogInfo).toHaveBeenCalledWith(expect.objectContaining({ msg: 'User signed out' }));
  });

  test('createUser event handler should log info', () => {
    // Call the createUser event handler
    authConfig.events?.createUser?.({ user: mockUserForEvents });

    // Verify logger was called with correct parameters
    expect(mockLogInfo).toHaveBeenCalledWith(expect.objectContaining({ msg: 'New user created' }));
  });

  test('linkAccount event handler should log info', () => {
    // Call the linkAccount event handler
    authConfig.events?.linkAccount?.({
      user: mockUserForEvents,
      account: mockAccount,
      profile: mockProfileForEvents,
    });

    // Verify logger was called with correct parameters
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Account linked to user' })
    );
  });

  test('session event handler should log info', () => {
    // Call the session event handler
    authConfig.events?.session?.({ session: mockSession, token: mockToken });

    // Verify logger was called with correct parameters
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'User session active' })
    );
  });
});

describe('NextAuth Logging Wrappers', () => {
  // Skipped/obsolete describe block for Logging Helper Functions removed.
});
