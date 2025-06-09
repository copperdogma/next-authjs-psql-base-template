import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RegistrationForm } from '@/app/register/components/RegistrationForm'; // Use named import
import * as authActions from '@/lib/actions/auth.actions'; // Import actions

// --- Top-level Mocks ---
jest.mock('@/lib/actions/auth.actions', () => ({
  registerUserAction: jest.fn(),
}));

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const mockSessionUpdate = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    update: mockSessionUpdate,
    data: null,
    status: 'unauthenticated',
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockRegisterUserAction = authActions.registerUserAction as jest.Mock;

describe('RegistrationForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test in THIS suite
    mockRegisterUserAction.mockClear();
    mockRouterPush.mockClear();
    mockSessionUpdate.mockClear();
    // Clear logger mocks if they are asserted
    const logger = jest.requireMock('@/lib/logger').logger;
    logger.info.mockClear();
    logger.debug.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
  });

  it('should render required fields', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should call registerUserAction action with form data on submit', async () => {
    mockRegisterUserAction.mockResolvedValue({ status: 'success' }); // Use status for consistency
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
      const formData = mockRegisterUserAction.mock.calls[0][1] as FormData;
      expect(formData.get('email')).toBe('new@example.com');
      expect(formData.get('password')).toBe('password123');
      // confirmPassword is not sent by the hook
      expect(formData.get('confirmPassword')).toBeNull();
    });
  });

  it('should display success message on successful registration', async () => {
    mockRegisterUserAction.mockResolvedValue({
      status: 'success', // Use status for consistency
      message: 'Registration successful!',
    });
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration successful!')).toBeInTheDocument();
  });

  it('should display error message on failed registration', async () => {
    mockRegisterUserAction.mockResolvedValue({ status: 'error', message: 'Email already in use.' }); // Use status
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already in use.')).toBeInTheDocument();
  });

  it('should display validation error if passwords do not match', async () => {
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'differentPassword');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(mockRegisterUserAction).not.toHaveBeenCalled();
  });

  it('should display default error message if action returns error status without a message', async () => {
    mockRegisterUserAction.mockResolvedValue({
      status: 'error',
      error: { code: 'GenericErrorWithoutMessage' },
    });
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
      const alert = screen.getByRole('alert');
      // The hook's processActionResult uses getDisplayErrorMessage,
      // which has a fallback of "An unexpected error occurred."
      // For a server action error, it tries to use result.error.message or result.message.
      // If these are missing, the specific default for registration is "Registration failed."
      expect(alert).toHaveTextContent('Registration failed.');
    });
  });

  it('should display error message if registerUserAction action throws an error', async () => {
    const thrownError = new Error('Network Error');
    mockRegisterUserAction.mockRejectedValueOnce(thrownError);
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'error@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Network Error')).toBeInTheDocument();
    expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
  });

  it("should display error message from action's error object if present", async () => {
    const actionError = new Error('Custom error from action');
    mockRegisterUserAction.mockResolvedValue({
      status: 'error',
      error: actionError,
    });
    render(<RegistrationForm />);

    // Reverting to regex selectors as they are proven to work in other tests
    await userEvent.type(screen.getByLabelText(/email address/i), 'actionerror@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Custom error from action')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Custom error from action');
  });

  it('should display specific success message and not redirect if action throws a fetch-related error (simulating user created but network issue post-creation)', async () => {
    const fetchError = new Error('Failed to fetch something post-registration');
    mockRegisterUserAction.mockRejectedValueOnce(fetchError); // Throws an error that _isFetchRelatedError will catch

    render(<RegistrationForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'fetcherror@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for the specific success message from the fetch-error handling path
    expect(
      await screen.findByText('Registration successful! Please sign in with your new account.')
    ).toBeInTheDocument();

    // Ensure no error message is displayed from the standard error path
    expect(
      screen.queryByText('Failed to fetch something post-registration')
    ).not.toBeInTheDocument();

    // Ensure router.push was not called because this specific success path doesn't trigger the redirect effect
    // (The `success` state in the main hook will be the fetch-error specific message, not the one useSuccessRedirectEffect listens for)
    // However, useSuccessRedirectEffect *will* still run due to `success` state changing.
    // We need to ensure it doesn't redirect to /dashboard or /login based on *this* success message.
    // The console logs would show it trying, but the key is no navigation call.
    await waitFor(() => {
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  // TODO: Add tests for loading state
  // TODO: Add tests for the redirect/session update logic in useEffect
});

describe('RegistrationForm - Success Redirect and Session Update Logic', () => {
  beforeEach(() => {
    // Clear all mocks before each test in THIS suite
    // Note: These mocks are defined at the top level of the file now.
    mockRegisterUserAction.mockClear();
    mockRouterPush.mockClear();
    mockSessionUpdate.mockClear();
    const logger = jest.requireMock('@/lib/logger').logger;
    logger.info.mockClear();
    logger.debug.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
  });

  // No afterEach with jest.resetModules() needed as mocks are top-level.

  it('should update session and redirect to /dashboard on successful registration and session update', async () => {
    mockRegisterUserAction.mockResolvedValue({
      status: 'success',
      message: 'Registration successful!',
    });
    mockSessionUpdate.mockResolvedValue({ user: { email: 'test@example.com' } });

    render(<RegistrationForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'success@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration successful!')).toBeInTheDocument();
    // Increased timeout and ensure mock is called before router.push
    await waitFor(() => expect(mockSessionUpdate).toHaveBeenCalledTimes(1), { timeout: 2000 });
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/dashboard'), {
      timeout: 2000,
    });
  });

  it('should redirect to /login if session update fails after successful registration', async () => {
    mockRegisterUserAction.mockResolvedValue({
      status: 'success',
      message: 'Registration successful!',
    });
    mockSessionUpdate.mockResolvedValue(null);

    render(<RegistrationForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sessionfail@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration successful!')).toBeInTheDocument();
    await waitFor(() => expect(mockSessionUpdate).toHaveBeenCalledTimes(1), { timeout: 2000 });
    await waitFor(
      () =>
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/login?message=registration_success_manual_login'
        ),
      { timeout: 2000 }
    );
  });

  it('should redirect to /login if session update throws an error', async () => {
    mockRegisterUserAction.mockResolvedValue({
      status: 'success',
      message: 'Registration successful!',
    });
    mockSessionUpdate.mockRejectedValue(new Error('Session update system crash'));

    render(<RegistrationForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sessioncrash@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration successful!')).toBeInTheDocument();
    await waitFor(() => expect(mockSessionUpdate).toHaveBeenCalledTimes(1), { timeout: 2000 });
    await waitFor(
      () =>
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/login?message=registration_error_manual_login'
        ),
      { timeout: 2000 }
    );
  });
});
