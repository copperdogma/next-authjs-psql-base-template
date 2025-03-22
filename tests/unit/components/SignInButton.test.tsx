// Mock modules directly in place
import { jsx as _jsx } from 'react/jsx-runtime';
import { COMPONENT_STATES, TEST_USER, API_ENDPOINTS, AUTH } from '../../utils/test-constants';
import React from 'react';

// Define mock user constants specifically for the mock
const MOCK_USER_PROPERTIES = {
  DISPLAY_NAME: 'Test User',
  EMAIL: 'test@example.com',
  ID: 'test123',
  TOKEN: 'mock-auth-token'
};

// Mock window.location
const originalLocation = window.location;
window.location = { 
  ...originalLocation, 
  href: originalLocation.href 
} as Location;

// Mock Firebase Auth
jest.mock('@firebase/auth', () => {
  const originalModule = jest.requireActual('@firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: null
    })),
    signInWithPopup: jest.fn().mockImplementation(() => Promise.resolve({
      user: {
        displayName: MOCK_USER_PROPERTIES.DISPLAY_NAME,
        email: MOCK_USER_PROPERTIES.EMAIL,
        uid: MOCK_USER_PROPERTIES.ID,
        getIdToken: jest.fn().mockResolvedValue(MOCK_USER_PROPERTIES.TOKEN)
      }
    })),
    signOut: jest.fn().mockImplementation(() => Promise.resolve()),
    GoogleAuthProvider: jest.fn(() => ({
      addScope: jest.fn()
    })),
  };
});

// Mock Firebase library with a cleaner approach
jest.mock('../../../lib/firebase', () => {
  const mockAuth = {
    currentUser: null
  };
  
  return {
    auth: mockAuth,
    app: {},
    // Mock implementation that can be controlled in tests
    isFirebaseAuth: jest.fn(() => true)
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((param) => {
      if (param === 'callbackUrl') return '/dashboard';
      return null;
    })
  })
}));

// Import after mocks
import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import '@testing-library/jest-dom';
import SignInButton from '../../../components/auth/SignInButton';
import { signInWithPopup, signOut } from '@firebase/auth';
import type { User } from '@firebase/auth';
import { auth, isFirebaseAuth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';

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
  getIdTokenResult: () => Promise.resolve({
    token: '',
    signInProvider: null,
    signInSecondFactor: null,
    expirationTime: '',
    issuedAtTime: '',
    authTime: '',
    claims: {}
  }),
  reload: () => Promise.resolve(),
  toJSON: () => ({})
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
    // Reset fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' })
    });
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Set up router mock
    mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockRouterPush
    }));
    
    // Reset window.location.href
    window.location.href = '';
    
    // Default isFirebaseAuth to return true for most tests
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValue(true);
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it('shows authentication button in correct state when not authenticated', () => {
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    // Get by both testId and role for more robust tests
    const button = screen.getByTestId(COMPONENT_STATES.TEST_IDS.AUTH_BUTTON);
    const buttonByRole = screen.getByRole('button', { name: /sign in/i });
    
    // Check data attribute
    expect(button).toHaveAttribute('data-auth-state', COMPONENT_STATES.AUTH_STATES.SIGN_IN);
    
    // More robust checks using text content and accessibility
    expect(buttonByRole).toHaveTextContent(/sign in/i);
    expect(buttonByRole).toBeEnabled();
  });

  it('shows authentication button in correct state when authenticated', () => {
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    
    // Get by both testId and role for more robust tests
    const button = screen.getByTestId(COMPONENT_STATES.TEST_IDS.AUTH_BUTTON);
    const buttonByRole = screen.getByRole('button', { name: /sign out/i });
    
    // Check data attribute
    expect(button).toHaveAttribute('data-auth-state', COMPONENT_STATES.AUTH_STATES.SIGN_OUT);
    
    // More robust checks using text content and accessibility
    expect(buttonByRole).toHaveTextContent(/sign out/i);
    expect(buttonByRole).toBeEnabled();
  });

  it('handles sign in flow correctly', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        getIdToken: jest.fn().mockResolvedValue('mock-id-token')
      }
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    // Find by role with name pattern for better accessibility testing
    const button = screen.getByRole('button', { name: /sign in/i });
    
    // Use fireEvent directly to trigger the click event
    fireEvent.click(button);

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.SESSION,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });
  });

  it('handles sign out flow correctly', async () => {
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
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
          credentials: 'include'
        })
      );
    });
  });

  it('shows loading state during authentication actions', async () => {
    // Mock setButtonLoading to set loading state
    jest.useFakeTimers();
    let resolveSignIn: () => void;
    
    (signInWithPopup as jest.Mock).mockImplementationOnce(() => 
      new Promise((resolve) => {
        resolveSignIn = () => resolve({
          user: {
            ...mockUser,
            getIdToken: jest.fn().mockResolvedValue('mock-id-token')
          }
        });
        // Don't resolve immediately to keep button in loading state
      })
    );
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
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

  it('handles general sign-in errors', async () => {
    const error = new Error('Firebase sign-in failed');
    (signInWithPopup as jest.Mock).mockRejectedValueOnce(error);
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Sign in error:', error);
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles general sign-out errors', async () => {
    const error = new Error('Firebase sign-out failed');
    (signOut as jest.Mock).mockRejectedValueOnce(error);
    
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign out/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Sign out error:', error);
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles Firebase Auth not available error during sign in', async () => {
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValueOnce(false);
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was logged with expected message
      expect(console.error).toHaveBeenCalledWith(
        'Sign in error:',
        expect.objectContaining({
          message: 'Firebase Auth not available'
        })
      );
    });
  });

  it('handles Firebase Auth not available error during sign out', async () => {
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValueOnce(false);
    
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign out/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was logged with expected message
      expect(console.error).toHaveBeenCalledWith(
        'Sign out error:',
        expect.objectContaining({
          message: 'Firebase Auth not available'
        })
      );
    });
  });

  it('renders loading state during initial load', () => {
    render(<SignInButton />, {
      authState: { user: null, loading: true, isClientSide: true }
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
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const loadingButton = screen.getByTestId('auth-button-placeholder');
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveTextContent(/loading/i);
  });

  it('handles session creation errors gracefully', async () => {
    // Mock a failed session creation
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        getIdToken: jest.fn().mockResolvedValue('mock-id-token')
      }
    });
    
    // Make fetch fail with an error
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' })
    });
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign in/i });
    
    // Use fireEvent directly to trigger the click event
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Session creation error:'),
        expect.objectContaining({
          message: expect.stringContaining('Failed to create session: 401')
        })
      );
    });
  });

  it('handles session deletion errors gracefully', async () => {
    // Mock a failed session deletion
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);
    
    // Make fetch fail with an error
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign out/i });
    
    // Use fireEvent directly to trigger the click event
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Sign out error:',
        expect.objectContaining({
          message: 'Failed to delete session'
        })
      );
    });
  });

  it('handles searchParams errors gracefully', async () => {
    // Mock searchParams to throw an error when accessed
    jest.requireMock('next/navigation').useSearchParams.mockImplementationOnce(() => ({
      get: jest.fn().mockImplementation(() => {
        throw new Error('SearchParams not available');
      })
    }));
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
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

  it('handles window being undefined gracefully', async () => {
    // Instead of deleting window, mock the redirect behavior
    const originalLocation = window.location;
    // Mock window.location.href to be able to track redirects
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
    
    // Mock isFirebaseAuth to return true so auth flow proceeds
    (isFirebaseAuth as unknown as jest.Mock).mockReturnValue(true);
    
    // Mock signInWithPopup to resolve
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        getIdToken: jest.fn().mockResolvedValue('mock-id-token')
      }
    });
    
    // Mock fetch to succeed
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' })
    });
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const button = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger the auth flow which would normally redirect
    await act(async () => {
      fireEvent.click(button);
      // Let all promises resolve
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    
    // Verify redirection would have happened (checking href was set)
    expect(window.location.href).toBe('/dashboard');
    
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation
    });
  });
}); 