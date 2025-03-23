// Mock modules directly in place
import { jsx as _jsx } from 'react/jsx-runtime';
import { COMPONENT_STATES, TEST_USER, API_ENDPOINTS, AUTH } from '../../utils/test-constants';
import React from 'react';

// Define mock user constants specifically for the mock
const MOCK_USER_PROPERTIES = {
  DISPLAY_NAME: 'Test User',
  EMAIL: 'test@example.com',
  ID: 'test123',
  TOKEN: 'mock-auth-token',
};

// Mock window.location
const originalLocation = window.location;
window.location = {
  ...originalLocation,
  href: originalLocation.href,
} as Location;

// Mock Firebase Auth
jest.mock('@firebase/auth', () => {
  const originalModule = jest.requireActual('@firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: null,
    })),
    signInWithPopup: jest.fn().mockImplementation(() =>
      Promise.resolve({
        user: {
          displayName: MOCK_USER_PROPERTIES.DISPLAY_NAME,
          email: MOCK_USER_PROPERTIES.EMAIL,
          uid: MOCK_USER_PROPERTIES.ID,
          getIdToken: jest.fn().mockResolvedValue(MOCK_USER_PROPERTIES.TOKEN),
        },
      })
    ),
    signOut: jest.fn().mockImplementation(() => Promise.resolve()),
    GoogleAuthProvider: jest.fn(() => ({
      addScope: jest.fn(),
    })),
  };
});

// Simplified Firebase library mock
jest.mock('../../../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn((auth, callback) => {
        callback(null);
        return jest.fn(); // unsubscribe function
      }),
    },
    app: {},
    isFirebaseAuth: jest.fn(() => true),
  };
});

// Simplified Firebase error utils mock
jest.mock('../../../lib/utils/firebase-errors', () => ({
  getFirebaseAuthErrorMessage: jest.fn(error => 'An error occurred'),
  handleFirebaseError: jest.fn((context, error) => 'An error occurred'),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation(param => {
      if (param === 'callbackUrl') return '/dashboard';
      return null;
    }),
  }),
}));

// Import after mocks
import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import '@testing-library/jest-dom';
import SignInButton from '../../../components/auth/SignInButton';
import { signInWithPopup, signOut } from '@firebase/auth';
import type { User } from '@firebase/auth';
import { auth, isFirebaseAuth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';
import {
  getFirebaseAuthErrorMessage,
  handleFirebaseError,
} from '../../../lib/utils/firebase-errors';
import { FirebaseError } from '@firebase/util';

// Mock user data
const mockUser = {
  displayName: TEST_USER.DISPLAY_NAME,
  email: TEST_USER.EMAIL,
  uid: TEST_USER.ID,
  emailVerified: false,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  phoneNumber: null,
  photoURL: null,
  providerId: 'google.com',
  delete: () => Promise.resolve(),
  getIdToken: jest.fn().mockResolvedValue(AUTH.MOCK_TOKEN),
  getIdTokenResult: () =>
    Promise.resolve({
      token: '',
      signInProvider: null,
      signInSecondFactor: null,
      expirationTime: '',
      issuedAtTime: '',
      authTime: '',
      claims: {},
    }),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
} as unknown as User;

/**
 * SignInButton Test Suite
 *
 * Note: The production environment behavior is difficult to test in Jest due to issues with mocking
 * process.env.NODE_ENV and the way the component's onClick handlers interact with the mocked environment.
 * Code coverage is set to a slightly lower threshold for this component specifically due to these
 * testing limitations. The production-specific code paths are:
 *
 * 1. Route redirection after sign-in/sign-out in production mode
 * 2. Production-specific error handling
 *
 * These are tested in e2e tests instead.
 */
describe('SignInButton', () => {
  let mockRouterPush: jest.Mock;

  // Create a backup of process.env
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock with a simpler implementation
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' }),
    });

    // Set up router mock
    mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockRouterPush,
    }));

    // Reset window.location.href
    window.location.href = '';

    // Default isFirebaseAuth to return true for most tests
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValue(true);
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it('shows sign in button when user is not authenticated', () => {
    // Arrange
    const authState = { user: null, loading: false, isClientSide: true };

    // Act
    render(<SignInButton />, { authState });

    // Assert
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toBeEnabled();
    expect(signInButton).toHaveTextContent('Sign In with Google');
  });

  it('shows sign out button when user is authenticated', () => {
    // Arrange
    const authState = { user: mockUser, loading: false, isClientSide: true };

    // Act
    render(<SignInButton />, { authState });

    // Assert
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();
    expect(signOutButton).toBeEnabled();
    expect(signOutButton).toHaveTextContent('Sign Out');
  });

  it('handles sign in flow correctly', async () => {
    // Arrange
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      },
    });

    // Act
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    // Find by role with name pattern for better accessibility testing
    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.SESSION,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('handles sign out flow correctly', async () => {
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true },
    });

    const button = screen.getByTestId('auth-button');

    // Use fireEvent directly to trigger the click event
    fireEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/session',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });
  });

  it('shows loading state during authentication actions', async () => {
    // Mock setButtonLoading to set loading state
    jest.useFakeTimers();
    let resolveSignIn: () => void;

    (signInWithPopup as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSignIn = () =>
            resolve({
              user: {
                ...mockUser,
                getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
              },
            });
          // Don't resolve immediately to keep button in loading state
        })
    );

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign in/i });

    // Click the button to start authentication
    fireEvent.click(button);

    // Force update to check loading state
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Button should now be in loading state
    const loadingButton = screen.getByTestId('auth-button');
    expect(loadingButton).toHaveAttribute('data-loading', 'true');
    expect(loadingButton).toHaveTextContent(/signing in/i);

    // Complete the authentication process
    await act(async () => {
      resolveSignIn();
      jest.runAllTimers();
    });

    jest.useRealTimers();
  });

  it('calls Firebase error handler with correct context for sign-in errors', async () => {
    const error = new FirebaseError(
      'auth/popup-closed-by-user',
      'Firebase: Error (auth/popup-closed-by-user).'
    );
    (signInWithPopup as jest.Mock).mockRejectedValueOnce(error);

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.click(button);
    });

    // Verify error handler was called with correct context and error
    expect(handleFirebaseError).toHaveBeenCalledWith('Sign In', error);
  });

  it('calls Firebase error handler with correct context for session creation errors', async () => {
    // Set up successful sign-in but failed session creation
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      },
    });

    // Make session creation fail
    const sessionError = new Error('Failed to create session: 401 - Unauthorized');
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.click(button);
    });

    // Verify session error was handled with proper context
    expect(handleFirebaseError).toHaveBeenCalledWith(
      'Session Creation',
      expect.objectContaining({
        message: expect.stringContaining('Failed to create session: 401'),
      })
    );
  });

  it('handles general sign-out errors', async () => {
    const error = new Error('Firebase sign-out failed');
    (signOut as jest.Mock).mockRejectedValueOnce(error);

    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign out/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(handleFirebaseError).toHaveBeenCalledWith('Sign Out', error);
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles Firebase Auth not available error during sign in', async () => {
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValueOnce(false);

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was handled properly
      expect(handleFirebaseError).toHaveBeenCalledWith(
        'Sign In',
        expect.objectContaining({
          message: 'Firebase Auth not available',
        })
      );
    });
  });

  it('handles Firebase Auth not available error during sign out', async () => {
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValueOnce(false);

    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign out/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was handled properly
      expect(handleFirebaseError).toHaveBeenCalledWith(
        'Sign Out',
        expect.objectContaining({
          message: 'Firebase Auth not available',
        })
      );
    });
  });

  it('renders loading state during initial load', () => {
    render(<SignInButton />, {
      authState: { user: null, loading: true, isClientSide: true },
    });

    const loadingButton = screen.getByTestId('auth-button-placeholder');
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveTextContent(/loading/i);
  });

  it('renders button correctly when not mounted yet', () => {
    // Force mounted state to be false by mocking useEffect to not run immediately
    jest.spyOn(React, 'useEffect').mockImplementationOnce(callback => {
      // Don't call the callback to simulate not mounted
      return undefined;
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const loadingButton = screen.getByTestId('auth-button-placeholder');
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveTextContent(/loading/i);
  });

  it('handles searchParams errors gracefully', async () => {
    // Mock searchParams to throw an error when accessed
    jest.requireMock('next/navigation').useSearchParams.mockImplementationOnce(() => ({
      get: jest.fn().mockImplementation(() => {
        throw new Error('SearchParams not available');
      }),
    }));

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true },
    });

    const button = screen.getByRole('button', { name: /sign in/i });

    // Click should still work and use default callback URL
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });
});
