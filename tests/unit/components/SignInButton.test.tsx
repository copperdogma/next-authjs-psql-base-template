import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('SignInButton Component', () => {
  const mockSignIn = jest.fn().mockResolvedValue(undefined);
  const mockSignOut = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays sign in button when user is not authenticated', () => {
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
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  it('displays sign out button when user is authenticated', () => {
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
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when authentication is in progress', () => {
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

    // Look for button with loading text instead of testId
    const loadingElement = screen.getByText(/loading/i);
    expect(loadingElement).toBeVisible();
    
    // If we need to test specific attributes of the loading state
    const button = screen.getByTestId('auth-button-placeholder');
    expect(button).toBeDisabled();
  });

  it('calls sign in function when clicked in signed out state', async () => {
    // Setup userEvent
    const user = userEvent.setup();
    
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

    // Use userEvent instead of fireEvent
    const button = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(button);

    // Verify the correct function was called
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('calls sign out function when clicked in signed in state', async () => {
    // Setup userEvent
    const user = userEvent.setup();
    
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

    // Use userEvent instead of fireEvent
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);

    // Verify the correct function was called
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
