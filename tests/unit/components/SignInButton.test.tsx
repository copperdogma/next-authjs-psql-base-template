import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInButton from '../../../components/auth/SignInButton';
import { AuthContext } from '../../../app/providers/AuthProvider';

// Mock Firebase auth
jest.mock('@firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({})),
}));

describe('SignInButton', () => {
  const mockSignIn = jest.fn().mockResolvedValue(undefined);
  const mockSignOut = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in button when user is not authenticated', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          isClientSide: true,
          signIn: mockSignIn,
          signOut: mockSignOut,
        }}
      >
        <SignInButton />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders sign out button when user is authenticated', () => {
    const mockUser = { uid: '123', displayName: 'Test User' };

    render(
      <AuthContext.Provider
        value={{
          user: mockUser as any,
          loading: false,
          isClientSide: true,
          signIn: mockSignIn,
          signOut: mockSignOut,
        }}
      >
        <SignInButton />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders loading state when auth is loading', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          loading: true,
          isClientSide: true,
          signIn: mockSignIn,
          signOut: mockSignOut,
        }}
      >
        <SignInButton />
      </AuthContext.Provider>
    );

    const button = screen.getByTestId('auth-button-placeholder');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/loading/i);
  });

  it('calls signIn when clicked in signed out state', async () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          isClientSide: true,
          signIn: mockSignIn,
          signOut: mockSignOut,
        }}
      >
        <SignInButton />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });

  it('calls signOut when clicked in signed in state', async () => {
    const mockUser = { uid: '123', displayName: 'Test User' };

    render(
      <AuthContext.Provider
        value={{
          user: mockUser as any,
          loading: false,
          isClientSide: true,
          signIn: mockSignIn,
          signOut: mockSignOut,
        }}
      >
        <SignInButton />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});
