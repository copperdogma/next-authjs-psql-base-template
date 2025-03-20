// Mock modules directly in place
import { jsx as _jsx } from 'react/jsx-runtime';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null
  })),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn()
  })),
  User: jest.fn(() => ({
    displayName: 'Test User',
    email: 'test@example.com',
    uid: 'test-user-id',
    emailVerified: false,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: () => Promise.resolve(),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
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

jest.mock('../../../lib/firebase', () => ({
  auth: {
    currentUser: null
  },
  app: {}
}));

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
import { signInWithPopup, signOut, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

// Mock user data
const mockUser = {
  displayName: 'Test User',
  email: 'test@example.com',
  uid: 'test-user-id',
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
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
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

describe('SignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' })
    });
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows authentication button in correct state when not authenticated', () => {
    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    expect(button).toHaveAttribute('data-auth-state', 'sign-in');
    expect(button).toBeEnabled();
  });

  it('shows authentication button in correct state when authenticated', () => {
    render(<SignInButton />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    expect(button).toHaveAttribute('data-auth-state', 'sign-out');
    expect(button).toBeEnabled();
  });

  it('handles sign in flow correctly', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: mockUser
    });

    render(<SignInButton />, {
      authState: { user: null, loading: false, isClientSide: true }
    });
    const button = screen.getByTestId('auth-button');
    
    await act(async () => {
      await fireEvent.click(button);
    });

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/session',
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

  // New tests for error handling
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

  afterEach(() => {
    jest.resetAllMocks();
    (console.error as jest.Mock).mockRestore();
  });
}); 