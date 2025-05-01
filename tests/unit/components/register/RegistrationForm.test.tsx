import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RegistrationForm } from '@/app/register/components/RegistrationForm'; // Use named import
import * as authActions from '@/lib/actions/auth.actions'; // Import actions

// Mock the server action
jest.mock('@/lib/actions/auth.actions', () => ({
  registerUserAction: jest.fn(), // Mock the renamed action
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    update: jest.fn(),
    data: null,
    status: 'unauthenticated',
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Explicitly type the mock
const mockRegisterUserAction = authActions.registerUserAction as jest.Mock;

describe('RegistrationForm', () => {
  beforeEach(() => {
    mockRegisterUserAction.mockClear();
    jest.clearAllMocks();
  });

  it('should render required fields', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should call registerUserAction action with form data on submit', async () => {
    mockRegisterUserAction.mockResolvedValue({ success: true });
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
      const formData = mockRegisterUserAction.mock.calls[0][0] as FormData;
      expect(formData.get('email')).toBe('new@example.com');
      expect(formData.get('password')).toBe('password123');
      expect(formData.has('confirmPassword')).toBe(false);
    });
  });

  it('should display success message on successful registration', async () => {
    mockRegisterUserAction.mockResolvedValue({
      success: true,
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
    mockRegisterUserAction.mockResolvedValue({ success: false, message: 'Email already in use.' });
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

  it('should display default error message if action returns success: false without a message', async () => {
    // Mock returns success: false but no specific message
    mockRegisterUserAction.mockResolvedValue({ success: false, message: undefined });
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Expect the default fallback message from the hook
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
    expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
  });

  it('should display error message if registerUserAction action throws an error', async () => {
    const thrownError = new Error('Network Error');
    mockRegisterUserAction.mockRejectedValueOnce(thrownError);
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'error@example.com');
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check if the error message from the thrown error is displayed
    expect(await screen.findByText('Network Error')).toBeInTheDocument();
    expect(mockRegisterUserAction).toHaveBeenCalledTimes(1);
  });

  // TODO: Add tests for loading state
  // TODO: Add tests for the redirect/session update logic in useEffect
});
