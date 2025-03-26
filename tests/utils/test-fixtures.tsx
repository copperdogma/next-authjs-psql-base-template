import { User } from '@firebase/auth';
import React, { ReactElement } from 'react';
import { RenderResult, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../app/providers/AuthProvider';
import { TEST_USER } from './test-constants';

/**
 * AuthContext type definition to ensure type safety in tests
 */
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isClientSide: boolean;
  signIn: jest.Mock;
  signOut: jest.Mock;
  error?: Error;
};

/**
 * Mock User Factory - Creates consistent mock user objects for tests
 * @param overrides - Optional overrides for specific user properties
 * @returns A mock user object compatible with Firebase Auth User type
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const defaultUser = {
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
        photoURL: TEST_USER.PHOTO_URL
      }
    ],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    tenantId: null,
    delete: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-id-token',
      claims: {},
      signInProvider: 'google.com',
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      authTime: new Date().toISOString()
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({})
  } as unknown as User;

  // Merge default values with overrides
  return {
    ...defaultUser,
    ...overrides
  };
}

/**
 * Auth State Fixtures - Common auth states for testing
 */
export const AuthStateFixtures = {
  // Not authenticated state
  notAuthenticated: {
    user: null,
    loading: false,
    isClientSide: true,
    signIn: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined)
  } as AuthContextType,

  // Authenticated state with default test user
  authenticated: (userOverrides: Partial<User> = {}): AuthContextType => ({
    user: createMockUser(userOverrides),
    loading: false,
    isClientSide: true,
    signIn: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined)
  }),

  // Loading state
  loading: {
    user: null,
    loading: true,
    isClientSide: true,
    signIn: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined)
  } as AuthContextType,

  // Error state with custom error handling
  error: (errorMessage: string = 'Authentication error'): AuthContextType => ({
    user: null,
    loading: false,
    isClientSide: true,
    error: new Error(errorMessage),
    signIn: jest.fn().mockRejectedValue(new Error(errorMessage)),
    signOut: jest.fn().mockResolvedValue(undefined)
  })
};

/**
 * AuthContext Provider wrapper for testing
 * Makes it easy to wrap components with authentication context
 */
export function withAuthProvider(
  ui: ReactElement,
  authState = AuthStateFixtures.notAuthenticated
): RenderResult {
  return render(
    <AuthContext.Provider value={authState}>{ui}</AuthContext.Provider>
  );
}

/**
 * Authentication testing utilities for all test types
 */
export const AuthTestUtils = {
  /**
   * Render a component with authentication context and userEvent setup
   * @param ui - Component to render
   * @param authState - Authentication state to use
   * @returns Test utilities and userEvent
   */
  renderWithAuth: (ui: ReactElement, authState = AuthStateFixtures.notAuthenticated) => {
    return {
      user: userEvent.setup(),
      ...withAuthProvider(ui, authState),
      // Return mock functions for easier assertions
      mockSignIn: authState.signIn,
      mockSignOut: authState.signOut
    };
  },

  /**
   * Render a component as authenticated
   * @param ui - Component to render
   * @param userOverrides - Optional user property overrides
   * @returns Test utilities and userEvent
   */
  renderAuthenticated: (ui: ReactElement, userOverrides: Partial<User> = {}) => {
    return AuthTestUtils.renderWithAuth(ui, AuthStateFixtures.authenticated(userOverrides));
  },

  /**
   * Render a component in loading state
   * @param ui - Component to render
   * @returns Test utilities and userEvent
   */
  renderLoading: (ui: ReactElement) => {
    return AuthTestUtils.renderWithAuth(ui, AuthStateFixtures.loading);
  },

  /**
   * Render a component with authentication error
   * @param ui - Component to render
   * @param errorMessage - Optional error message
   * @returns Test utilities and userEvent
   */
  renderWithError: (ui: ReactElement, errorMessage?: string) => {
    return AuthTestUtils.renderWithAuth(ui, AuthStateFixtures.error(errorMessage));
  }
}; 