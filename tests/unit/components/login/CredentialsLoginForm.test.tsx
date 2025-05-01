import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CredentialsLoginForm from '@/app/login/components/CredentialsLoginForm'; // Assuming rename happens

// Mock the signIn function from next-auth/react
const mockSignIn = jest.fn();
// --- Remove unused state mocks ---
// const mockSetIsLoading = jest.fn();
// const mockSetError = jest.fn();
// --- End mocks ---

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: (...args: any[]) => mockSignIn(...args),
}));

describe('CredentialsLoginForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSignIn.mockClear();
  });

  it('should render email and password fields', () => {
    // Remove props that the component doesn't accept
    render(<CredentialsLoginForm />);

    // Check for email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // Check for password input
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render a submit button for credentials', () => {
    // Remove props that the component doesn't accept
    render(<CredentialsLoginForm />);

    // Check for the credentials sign-in button
    expect(
      screen.getByRole('button', { name: /sign in with credentials|sign in with email/i })
    ).toBeInTheDocument();
  });

  it('should call signIn with credentials when submitted', async () => {
    // Remove props that the component doesn't accept
    render(<CredentialsLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });

    // Simulate user input
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Simulate form submission
    await userEvent.click(submitButton);

    // Check if signIn was called correctly
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should display an error message on failed login', async () => {
    // Mock signIn to return an error
    mockSignIn.mockResolvedValueOnce({ error: 'CredentialsSignin', ok: false });

    // Remove props that the component doesn't accept
    render(<CredentialsLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    // Get the form element
    const form = emailInput.closest('form');
    if (!form) throw new Error('Could not find form element');

    // Simulate user input and submission via form submit event
    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    // Trigger submit directly
    await act(async () => {
      fireEvent.submit(form);
    });

    // Check for error message display - Assert UI directly
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('should disable inputs and show loading text during submission', async () => {
    // Create a controllable promise for the mock
    let resolveSignIn: (value: { ok: boolean; error?: string }) => void;
    const signInPromise = new Promise<{ ok: boolean; error?: string }>(resolve => {
      resolveSignIn = resolve;
    });
    mockSignIn.mockImplementation(() => signInPromise);

    // Remove props that the component doesn't accept
    render(<CredentialsLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });

    // --- Simulate User Input ---
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Ensure button is enabled before click
    expect(submitButton).not.toBeDisabled();

    // Get the form element
    const form = emailInput.closest('form');
    if (!form) throw new Error('Could not find form element');
    // Trigger submit directly
    await act(async () => {
      fireEvent.submit(form);
    });

    // --- Assert Loading State Change - Check UI directly ---
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /signing in.../i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    // --- Resolve the mock sign in ---
    await act(async () => {
      const originalError = console.error;
      console.error = jest.fn(); // Suppress console error during controlled promise resolution
      resolveSignIn({ ok: true }); // Simulate successful sign in
      await signInPromise; // Wait for the promise to resolve
      console.error = originalError;
    });

    // --- Assert Final State UI - Check UI directly ---
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /sign in with email/i });
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/password/i)).not.toBeDisabled();
    });
  });

  // Add more tests later for interaction and calling signIn
});
