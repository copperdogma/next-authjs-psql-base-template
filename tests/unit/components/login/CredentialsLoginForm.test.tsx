import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CredentialsLoginForm } from '@/components/auth/CredentialsLoginForm';
import { renderWithAuth } from '@/tests/utils/test-utils';

// Mock auth-logging
jest.mock('@/lib/auth-logging', () => {
  const mockSignInInside = jest.fn();
  return {
    signInWithLogging: mockSignInInside, // Export the mock function under the standard name
    _mockSignIn: mockSignInInside, // Export it under a different name for test access
  };
});

// Mocks for props (ensure these are defined before mockProps)
const mockSetIsLoading = jest.fn();
const mockSetError = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(), // Mock the hook itself
  useSearchParams: jest.fn(), // Mock the hook itself
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(), // Mock child method if needed
  },
}));

// Define mockProps to be reused
const mockProps = {
  isLoading: false,
  setIsLoading: mockSetIsLoading,
  error: null,
  setError: mockSetError,
};

describe('CredentialsLoginForm', () => {
  let mockSignIn: jest.Mock;
  let mockRouterPush: jest.Mock;
  let mockSearchParamsGet: jest.Mock;

  beforeEach(() => {
    mockSignIn = jest.requireMock('@/lib/auth-logging')._mockSignIn;
    mockSignIn.mockClear();
    mockSetIsLoading.mockClear();
    mockSetError.mockClear();

    // Set up mock return values for the hooks
    mockRouterPush = jest.fn();
    (jest.requireMock('next/navigation').useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });

    mockSearchParamsGet = jest.fn().mockReturnValue(null);
    (jest.requireMock('next/navigation').useSearchParams as jest.Mock).mockReturnValue({
      get: mockSearchParamsGet,
    });
  });

  it('should render the form correctly', () => {
    renderWithAuth(<CredentialsLoginForm {...mockProps} />);
    // Use selector option for specificity
    expect(screen.getByLabelText(/email address/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
  });

  it('should allow typing in email and password fields', async () => {
    renderWithAuth(<CredentialsLoginForm {...mockProps} />);
    // Use selector option for specificity
    const emailInput = screen.getByLabelText(/email address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call signIn with credentials on submit', async () => {
    renderWithAuth(<CredentialsLoginForm {...mockProps} />);
    // Use selector option for specificity
    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
  });

  it('should redirect to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: true, error: null, url: '/dashboard' });

    renderWithAuth(<CredentialsLoginForm {...mockProps} />);
    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    const setErrorCalls = mockSetError.mock.calls;
    const lastSetErrorCall = setErrorCalls[setErrorCalls.length - 1];
    expect(lastSetErrorCall[0]).toBeNull();
    expect(mockSetIsLoading).toHaveBeenLastCalledWith(true);
  });

  it('should redirect to callbackUrl on successful login if provided', async () => {
    // Mock searchParams.get to return a value for this test
    mockSearchParamsGet.mockReturnValue('/custom-path');
    mockSignIn.mockResolvedValueOnce({ ok: true, error: null, url: '/dashboard' });

    renderWithAuth(<CredentialsLoginForm {...mockProps} />);
    // Use selector option for specificity
    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/custom-path'); // Assert the mock push function
  });

  it('should display an error message on failed login', async () => {
    mockSignIn.mockResolvedValueOnce({
      ok: false,
      error: 'CredentialsSignin',
      url: null,
    });

    let currentProps = { ...mockProps, isLoading: false, error: null };
    const { rerender } = renderWithAuth(<CredentialsLoginForm {...currentProps} />);

    // Override mocks to trigger rerender on state change
    mockSetIsLoading.mockImplementation(loading => {
      currentProps = { ...currentProps, isLoading: loading };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });
    mockSetError.mockImplementation(err => {
      currentProps = { ...currentProps, error: err };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });

    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'wrong@example.com'
    );
    await userEvent.type(
      screen.getByLabelText(/password/i, { selector: 'input' }),
      'wrongpassword'
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    // Assert mock calls
    const expectedError = 'Invalid email or password.';
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false); // Should be called on failure
    expect(mockSetError).toHaveBeenCalledWith(expectedError);

    // Assert error message visibility after rerender
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(expectedError);
    });
  });

  it('should display a generic error message for other signIn failures', async () => {
    mockSignIn.mockResolvedValueOnce({
      ok: false,
      error: 'SomeOtherError',
      url: null,
    });

    let currentProps = { ...mockProps, isLoading: false, error: null };
    const { rerender } = renderWithAuth(<CredentialsLoginForm {...currentProps} />);

    // Override mocks to trigger rerender
    mockSetIsLoading.mockImplementation(loading => {
      currentProps = { ...currentProps, isLoading: loading };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });
    mockSetError.mockImplementation(err => {
      currentProps = { ...currentProps, error: err };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });

    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'user@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    // Assert mock calls
    const expectedError = 'Login failed. Please check your details or try another method.';
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    expect(mockSetError).toHaveBeenCalledWith(expectedError);

    // Assert error message visibility after rerender
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(expectedError);
    });
  });

  it('should display an unexpected error message if signIn throws', async () => {
    const thrownError = new Error('Network Error');
    mockSignIn.mockRejectedValueOnce(thrownError);

    const expectedError = 'An unexpected error occurred. Please try again later.';
    let currentProps = { ...mockProps, isLoading: false, error: null };
    const { rerender } = renderWithAuth(<CredentialsLoginForm {...currentProps} />);

    // Override mocks to trigger rerender
    mockSetIsLoading.mockImplementation(loading => {
      currentProps = { ...currentProps, isLoading: loading };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });
    mockSetError.mockImplementation(err => {
      currentProps = { ...currentProps, error: err };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });

    await userEvent.type(
      screen.getByLabelText(/email address/i, { selector: 'input' }),
      'user@example.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    });

    // Assert mock calls
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false); // Called in component's finally or catch block
    expect(mockSetError).toHaveBeenCalledWith(expectedError); // Now setError is called with the generic user-friendly message

    // Assert error message visibility after rerender
    // The component should translate the raw error to a user-friendly one for display.
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(expectedError); // User sees translated error
    });
  });

  it('should disable inputs and show loading text during submission', async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, error: null, url: '/dashboard' }), 50)
        )
    );

    // Initial props
    let currentProps = { ...mockProps, isLoading: false };
    const { rerender } = renderWithAuth(<CredentialsLoginForm {...currentProps} />);

    const emailInput = screen.getByLabelText(/email address/i, { selector: 'input' });
    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' });
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Override mockSetIsLoading to allow us to capture the call and then rerender
    mockSetIsLoading.mockImplementation(loading => {
      currentProps = { ...currentProps, isLoading: loading };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });
    // Also override mockSetError for completeness, though not strictly needed for this specific test's primary path
    mockSetError.mockImplementation(err => {
      currentProps = { ...currentProps, error: err };
      rerender(<CredentialsLoginForm {...currentProps} />);
    });

    await act(async () => {
      await userEvent.click(submitButton);
    });

    // By the time click promise resolves, mockSetIsLoading(true) should have been called,
    // and the component rerendered with isLoading: true.
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);

    // Assertions for loading state (inputs disabled, button text changes)
    // These should now reflect the rerendered state
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing In...');

    // Wait for the signIn mock to resolve and subsequent actions (like router.push)
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/dashboard'));

    // On success, setIsLoading(false) is NOT called by the component,
    // so the component remains in its isLoading=true state visually until unmounted/redirected.
    // The mockSetIsLoading.mock.calls will show [true].
    expect(mockSetIsLoading).toHaveBeenCalledTimes(1);
    expect(mockSetIsLoading).toHaveBeenLastCalledWith(true);
  });

  it('should validate email and password fields locally first', async () => {
    // ... existing code ...
  });

  // Add more tests later for interaction and calling signIn
});
