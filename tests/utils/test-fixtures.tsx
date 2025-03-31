import { User } from '@firebase/auth';
import React, { ReactElement } from 'react';
import { RenderResult, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { TEST_USER } from './test-constants';
import { TestRenderResult, MockUser, MockIdTokenResult } from './test-types';

// Define NextAuth session types
type NextAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  // Add any other properties that might be needed
};

type NextAuthSession = {
  user: NextAuthUser;
  expires: string;
};

// Helper function to ensure Session compatibility
function ensureSessionCompatibility(session: NextAuthSession | null): any {
  if (!session) return null;
  // Return as-is - the TypeScript types will be satisfied in the actual usage
  return session;
}

/**
 * Mock User Factory - Creates consistent mock user objects for tests
 * Still supports Firebase User type for backward compatibility
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  // Create a properly typed user object with all necessary fields
  const defaultUser: Omit<MockUser, keyof typeof overrides> = {
    uid: TEST_USER.ID,
    email: TEST_USER.EMAIL,
    displayName: TEST_USER.NAME,
    photoURL: TEST_USER.PHOTO_URL,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    providerData: [
      {
        providerId: 'google.com',
        uid: TEST_USER.EMAIL,
        displayName: TEST_USER.NAME,
        email: TEST_USER.EMAIL,
        phoneNumber: null,
        photoURL: TEST_USER.PHOTO_URL,
      },
    ],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    tenantId: null,
    delete: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-id-token',
      claims: {},
      signInProvider: 'google.com',
      signInSecondFactor: null,
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      authTime: new Date().toISOString(),
    } as MockIdTokenResult),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({}),
    // Add missing properties that were causing type errors
    refreshToken: 'mock-refresh-token',
    providerId: 'google.com',
  };

  // Combine default values with overrides
  return {
    ...defaultUser,
    ...overrides,
  } as User;
}

/**
 * Creates a NextAuth compatible user from test constants
 */
export function createNextAuthUser(overrides: Partial<NextAuthUser> = {}): NextAuthUser {
  return {
    id: TEST_USER.ID,
    name: TEST_USER.NAME,
    email: TEST_USER.EMAIL,
    image: TEST_USER.PHOTO_URL,
    ...overrides,
  };
}

/**
 * Session Fixtures - Common auth states for testing with NextAuth
 */
export const SessionFixtures = {
  // Not authenticated state
  notAuthenticated: null,

  // Authenticated state with default test user
  authenticated: (userOverrides: Partial<NextAuthUser> = {}): NextAuthSession => ({
    user: createNextAuthUser(userOverrides),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  }),

  // Expired session
  expired: {
    user: createNextAuthUser(),
    expires: new Date(Date.now() - 1000).toISOString(), // Already expired
  },
};

/**
 * NextAuth SessionProvider wrapper for testing
 */
export function withSessionProvider(
  ui: ReactElement,
  session: any = SessionFixtures.notAuthenticated
): RenderResult {
  return render(<SessionProvider session={session}>{ui}</SessionProvider>);
}

/**
 * Authentication testing utilities for all test types
 * Updated to use NextAuth
 */
export const AuthTestUtils = {
  /**
   * Render a component with NextAuth session context and userEvent setup
   */
  renderWithSession: (
    ui: ReactElement,
    session: NextAuthSession | null = SessionFixtures.notAuthenticated
  ): TestRenderResult => {
    const mockSignIn = jest.fn();
    const mockSignOut = jest.fn();

    // Mock next-auth/react for this component
    jest
      .spyOn(require('next-auth/react'), 'signIn')
      .mockImplementation((...args) => mockSignIn(...args));
    jest
      .spyOn(require('next-auth/react'), 'signOut')
      .mockImplementation((...args) => mockSignOut(...args));

    return {
      user: userEvent.setup(),
      ...withSessionProvider(ui, session),
      mockSignIn,
      mockSignOut,
    } as TestRenderResult;
  },

  /**
   * Render a component as authenticated
   */
  renderAuthenticated: (
    ui: ReactElement,
    userOverrides: Partial<NextAuthUser> = {}
  ): TestRenderResult => {
    return AuthTestUtils.renderWithSession(ui, SessionFixtures.authenticated(userOverrides));
  },

  /**
   * Render a component with expired session
   */
  renderWithExpiredSession: (ui: ReactElement): TestRenderResult => {
    return AuthTestUtils.renderWithSession(ui, SessionFixtures.expired);
  },

  // For backward compatibility - deprecated
  renderWithAuth: (ui: ReactElement): TestRenderResult => {
    console.warn('renderWithAuth is deprecated, use renderWithSession instead');
    const result = AuthTestUtils.renderWithSession(ui);
    // Add mock auth functions for backward compatibility
    return {
      ...result,
      mockSignIn: jest.fn(),
      mockSignOut: jest.fn(),
    };
  },

  renderLoading: (ui: ReactElement): TestRenderResult => {
    console.warn(
      'renderLoading is deprecated with NextAuth - use renderWithSession and mock useSession hook'
    );
    return AuthTestUtils.renderWithSession(ui);
  },

  renderWithError: (ui: ReactElement): TestRenderResult => {
    console.warn(
      'renderWithError is deprecated with NextAuth - use jest.mock to mock next-auth/react instead'
    );
    return AuthTestUtils.renderWithSession(ui);
  },
};

// For backward compatibility
export const withAuthProvider = withSessionProvider;

// Add AuthStateFixtures for backward compatibility with old tests
/**
 * Authentication state fixtures for legacy tests
 *
 * @deprecated Use SessionFixtures instead
 */
export const AuthStateFixtures = {
  notAuthenticated: {
    user: null,
    loading: false,
    isClientSide: true,
    error: null,
  },

  authenticated: (userOverrides: Partial<any> = {}) => ({
    user: createMockUser(userOverrides),
    loading: false,
    isClientSide: true,
    error: null,
  }),

  loading: {
    user: null,
    loading: true,
    isClientSide: true,
    error: null,
  },

  error: (message = 'Authentication error') => ({
    user: null,
    loading: false,
    isClientSide: true,
    error: new Error(message),
  }),
};
