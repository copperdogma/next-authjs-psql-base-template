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

// Store original NODE_ENV - don't use this inside mock factories
const originalNodeEnv = process.env.NODE_ENV;

// Mock Firebase Auth
jest.mock('@firebase/auth', () => ({
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
  User: jest.fn(() => ({
    displayName: MOCK_USER_PROPERTIES.DISPLAY_NAME,
    email: MOCK_USER_PROPERTIES.EMAIL,
    uid: MOCK_USER_PROPERTIES.ID,
    emailVerified: false,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: () => Promise.resolve(),
    getIdToken: jest.fn().mockResolvedValue(MOCK_USER_PROPERTIES.TOKEN),
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
  }))
}));

// Mock Firebase library with a cleaner approach
jest.mock('../../../lib/firebase', () => {
  const mockAuth = {
    currentUser: null
  };
  
  return {
    auth: mockAuth,
    app: {},
    // Mock implementation that can be controlled in tests
    isFirebaseAuth: jest.fn()
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
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
    
    // Default isFirebaseAuth to return true for most tests
    (isFirebaseAuth as jest.Mock).mockReturnValue(true);
    
    // Reset environment to test mode
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
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
      user: mockUser
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    // Find by role with name pattern for better accessibility testing
    const button = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.SESSION,
        expect.objectContaining({
          method: 'POST'
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
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/session',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  it('shows loading state during authentication actions', async () => {
    // Never resolve to keep button in loading state
    (signInWithPopup as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-loading', 'true');
  });

  // Tests for error handling
  it('handles failed session creation after sign-in', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: mockUser
    });
    
    // Mock failed session creation
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Sign in error:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles failed session deletion during sign-out', async () => {
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);
    
    // Mock failed session deletion
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false
    });

    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Sign out error:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles general sign-in errors', async () => {
    const error = new Error('Firebase sign-in failed');
    (signInWithPopup as jest.Mock).mockRejectedValueOnce(error);

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
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
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Sign out error:', error);
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles Firebase Auth not available error during sign in', async () => {
    // Make isFirebaseAuth return false in test environment too
    (isFirebaseAuth as jest.Mock).mockReturnValue(false);
    
    // Set NODE_ENV to 'production' to test non-test branch
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was logged with expected message
      expect(console.error).toHaveBeenCalledWith(
        'Sign in error:',
        expect.objectContaining({
          message: 'Firebase Auth not available'
        })
      );
      // Check that button is enabled again
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('handles Firebase Auth not available error during sign out', async () => {
    // Make isFirebaseAuth return false in test environment too
    (isFirebaseAuth as jest.Mock).mockReturnValue(false);
    
    // Set NODE_ENV to 'production' to test non-test branch
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });

    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error was logged with expected message
      expect(console.error).toHaveBeenCalledWith(
        'Sign out error:',
        expect.objectContaining({
          message: 'Firebase Auth not available'
        })
      );
      // Check that button is enabled again
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('data-loading', 'true');
    });
  });

  it('renders loading state during initial load', () => {
    render(<SignInButton />, {
      authState: { user: null, loading: true, isClientSide: true }
    });
    
    const loadingButton = screen.getByTestId('auth-button-placeholder');
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toHaveTextContent('Loading...');
    expect(loadingButton).toBeDisabled();
  });

  it('renders button correctly when not mounted yet', () => {
    // Force mounted state to be false by not triggering useEffect
    jest.spyOn(React, 'useEffect').mockImplementationOnce(() => {});
    
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    
    const loadingButton = screen.getByTestId('auth-button-placeholder');
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toHaveTextContent('Loading...');
    expect(loadingButton).toBeDisabled();
  });

  afterEach(() => {
    jest.resetAllMocks();
    (console.error as jest.Mock).mockRestore();
    // Reset process.env.NODE_ENV to original state
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
  });
}); 