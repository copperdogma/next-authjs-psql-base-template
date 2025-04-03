import React from 'react';
import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import SignInButton from '../../../components/auth/SignInButton';
import { useSession, signIn, signOut } from 'next-auth/react';

// Mock the next-auth/react module
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('SignInButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays sign in button when user is not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<SignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  test('displays sign out button when user is authenticated', () => {
    // Mock the useSession hook to return authenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    render(<SignInButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  test('shows loading state when authentication is in progress', () => {
    // Mock the useSession hook to return loading state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<SignInButton />);

    const loadingElement = screen.getByText(/loading/i);
    expect(loadingElement).toBeVisible();

    const button = screen.getByTestId('auth-button-placeholder');
    expect(button).toBeDisabled();
  });

  test('calls sign in function when clicked in signed out state', async () => {
    // Mock the useSession hook to return unauthenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // Set up user event
    const user = userEvent.setup();

    render(<SignInButton />);

    // Find and click the button
    const button = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(button);

    // Verify the correct function was called
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
  });

  test('calls sign out function when clicked in signed in state', async () => {
    // Mock the useSession hook to return authenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    // Set up user event
    const user = userEvent.setup();

    render(<SignInButton />);

    // Find and click the button
    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);

    // Verify the correct function was called
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
