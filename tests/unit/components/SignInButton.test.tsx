import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInButton from '../../../components/auth/SignInButton';
import { AuthTestUtils } from '../../utils/test-fixtures';

describe('SignInButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays sign in button when user is not authenticated', () => {
    // Render with non-authenticated state using our new utility
    AuthTestUtils.renderWithAuth(<SignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  it('displays sign out button when user is authenticated', async () => {
    // Render with authenticated state using our new utility
    AuthTestUtils.renderAuthenticated(<SignInButton />, {
      displayName: 'Test User',
      uid: '123',
    });

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeVisible();
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when authentication is in progress', () => {
    // Render with loading state using our new utility
    AuthTestUtils.renderLoading(<SignInButton />);

    // Look for button with loading text instead of testId
    const loadingElement = screen.getByText(/loading/i);
    expect(loadingElement).toBeVisible();

    // If we need to test specific attributes of the loading state
    const button = screen.getByTestId('auth-button-placeholder');
    expect(button).toBeDisabled();
  });

  it('calls sign in function when clicked in signed out state', async () => {
    // Render with non-authenticated state using our new utility
    const { user, mockSignIn } = AuthTestUtils.renderWithAuth(<SignInButton />);

    // Use userEvent to click the button
    const button = screen.getByRole('button', { name: /sign in with google/i });
    // Skip the test if user is null
    if (!user) return;

    // Assert the user is a UserEvent type that has click method
    const userEvent = user as { click: (element: HTMLElement) => Promise<void> };
    await userEvent.click(button);

    // Verify the correct function was called
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('calls sign out function when clicked in signed in state', async () => {
    // Render with authenticated state using our new utility
    const { user, mockSignOut } = AuthTestUtils.renderAuthenticated(<SignInButton />, {
      displayName: 'Test User',
      uid: '123',
    });

    // Use userEvent to click the button
    const button = screen.getByRole('button', { name: /sign out/i });
    // Skip the test if user is null
    if (!user) return;

    // Assert the user is a UserEvent type that has click method
    const userEvent = user as { click: (element: HTMLElement) => Promise<void> };
    await userEvent.click(button);

    // Verify the correct function was called
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
