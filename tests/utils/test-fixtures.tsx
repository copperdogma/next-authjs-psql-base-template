import { ReactElement, ReactNode } from 'react';
import { RenderResult, render, RenderOptions as RTLRenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { TestRenderResult, MockUser, MockIdTokenResult } from './test-types';

const defaultMockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  phoneNumber: null,
  isAnonymous: false,
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  providerId: 'google.com',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [
    {
      providerId: 'google.com',
      uid: 'test@example.com',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
      photoURL: 'https://example.com/photo.jpg',
    },
  ],
  getIdToken: () => Promise.resolve('mock-id-token'),
  getIdTokenResult: () =>
    Promise.resolve({
      token: 'mock-id-token',
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: {},
    } as MockIdTokenResult),
  delete: () => Promise.resolve(),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
};

const createBaseMockUser = (): MockUser => ({
  ...defaultMockUser,
});

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  const base = createBaseMockUser();
  const merged = { ...base, ...overrides };
  return merged as MockUser;
};

type SessionWithUser = Session & {
  user: MockUser & { id: string };
  expires: string;
};

export const SessionFixtures = {
  notAuthenticated: null as null,
  authenticated: (userOverrides: Partial<MockUser> = {}): SessionWithUser => ({
    user: { ...createMockUser(userOverrides), id: 'test-id' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
  expired: {
    user: { ...createMockUser(), id: 'test-id' },
    expires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  } as SessionWithUser,
};

/**
 * NextAuth SessionProvider wrapper for testing
 */
export function withSessionProvider(
  ui: ReactElement,
  session: SessionWithUser | null = SessionFixtures.notAuthenticated
): RenderResult {
  return render(<SessionProvider session={session}>{ui}</SessionProvider>);
}

type WrapperProps = {
  children: ReactNode;
};

type CustomRenderOptions = RTLRenderOptions & {
  wrapper?: (props: WrapperProps) => ReactElement;
};

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
    session: SessionWithUser | null = null
  ): TestRenderResult => {
    const mockSignIn = jest.fn();
    const mockSignOut = jest.fn();

    const wrapper = ({ children }: WrapperProps) => (
      <SessionProvider session={session}>{children}</SessionProvider>
    );

    return {
      ...render(ui, { wrapper } as CustomRenderOptions),
      mockSignIn,
      mockSignOut,
    } as TestRenderResult;
  },

  /**
   * Render a component as authenticated
   */
  renderAuthenticated: (
    ui: ReactElement,
    userOverrides: Partial<MockUser> = {}
  ): TestRenderResult => {
    const session = SessionFixtures.authenticated(userOverrides);
    return AuthTestUtils.renderWithSession(ui, session);
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

  authenticated: (userOverrides: Partial<MockUser> = {}) => ({
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
    error: message,
  }),
};
