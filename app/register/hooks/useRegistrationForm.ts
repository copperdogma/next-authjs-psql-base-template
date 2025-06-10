'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUserAction } from '@/lib/actions/auth.actions';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useSession, SessionContextValue } from 'next-auth/react';
import type { ServiceResponse } from '@/types';
import { getDisplayErrorMessage } from '@/lib/utils/error-display';

// Hook for handling the redirect effect on success
const useSuccessRedirectEffect = (
  success: string | null,
  isSubmitting: boolean,
  router: ReturnType<typeof useRouter>,
  updateSession: SessionContextValue['update']
) => {
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (success && !isSubmitting) {
      logger.debug(
        '[Client] useSuccessRedirectEffect: Detected success state, isSubmitting is false.'
      );
      timer = setTimeout(async () => {
        logger.debug(
          '[Client] useSuccessRedirectEffect: Timer fired. Attempting to update session before redirect...'
        );
        try {
          // updateSession() in v5 returns the session object or null
          const session = await updateSession();

          if (session) {
            logger.debug(
              '[Client] useSuccessRedirectEffect: Session updated successfully. Redirecting to /dashboard via router.push.',
              { sessionData: session } // Log actual session data for debugging
            );
            router.push('/dashboard');
          } else {
            logger.warn(
              '[Client] useSuccessRedirectEffect: Session update failed or returned no session. Redirecting to /login.'
            );
            // If auto-sign-in was expected but session is not there, redirect to login
            router.push('/login?message=registration_success_manual_login');
          }
        } catch (error) {
          logger.error(
            // Changed to console.error for actual errors
            '[Client] useSuccessRedirectEffect: Exception during session update or redirect. Redirecting to /login.',
            error
          );
          // Fallback redirect to login on any exception
          router.push('/login?message=registration_error_manual_login');
        }
      }, 300); // Initial delay for user feedback
    }

    // Cleanup function to clear the timer if the component unmounts
    // or if dependencies change before the timer fires.
    return () => {
      if (timer) {
        logger.debug('[Client] useSuccessRedirectEffect: Cleanup called, clearing timer.');
        clearTimeout(timer);
      }
    };
    // Add all dependencies used inside the effect
  }, [success, isSubmitting, router, updateSession]);
};

// Define schema and type within the hook file or import if shared
const formSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type FormValues = z.infer<typeof formSchema>;

// Utility to check for fetch-like errors
function _isFetchRelatedError(err: unknown): boolean {
  if (err instanceof Error && err.message?.includes('fetch')) {
    return true;
  }

  // Check for error with a nested cause.message structure
  if (typeof err === 'object' && err !== null) {
    const errorAsObject = err as { cause?: unknown };
    if (typeof errorAsObject.cause === 'object' && errorAsObject.cause !== null) {
      const causeAsObject = errorAsObject.cause as { message?: unknown };
      if (typeof causeAsObject.message === 'string' && causeAsObject.message.includes('fetch')) {
        return true;
      }
    }
  }
  return false;
}

// Helper function to handle errors during registration form submission
function handleRegistrationSubmitError(
  err: unknown,
  setError: (message: string | null) => void,
  setSuccess: (message: string | null) => void
) {
  // Use logger.error() for proper error logging

  if (_isFetchRelatedError(err)) {
    // If this is a fetch error but user was created, show success message
    setSuccess('Registration successful! Please sign in with your new account.');
  } else {
    // For other errors, show error message
    setError(
      getDisplayErrorMessage(
        err instanceof Error ? err : null,
        'An unexpected error occurred during registration.'
      )
    );
  }
}

/**
 * A custom hook that manages the state and logic for the user registration form.
 *
 * This hook encapsulates:
 * - Form state management using `react-hook-form` with Zod validation
 * - Form submission handling with the `registerUserAction` server action
 * - Error and success state management
 * - Submission pending state tracking
 * - Automatic redirection after successful registration
 * - Session update on successful registration
 *
 * The hook implements a complete registration flow, from form validation to
 * post-registration navigation, with appropriate error handling at each step.
 * After successful registration, it updates the session and redirects to the
 * dashboard or login page based on the session status.
 *
 * @returns {Object} An object containing:
 *   - `form` - The react-hook-form instance with register, handleSubmit, and formState
 *   - `onSubmit` - Form submission handler function to be used with form.handleSubmit
 *   - `isPending` - Boolean indicating if submission is in progress
 *   - `error` - Error message string or null if no error
 *   - `success` - Success message string or null if not successful
 */
export function useRegistrationForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function to process the action result
  const processActionResult = (result: ServiceResponse<null, unknown>) => {
    if (result.status === 'success') {
      setSuccess(result.message || 'Registration successful!');
      logger.debug(
        '[Client] useRegistrationForm: Success result received, success state updated.',
        result
      );
    } else {
      const mainError = result.error?.message || result.message || 'Registration failed.';
      setError(
        getDisplayErrorMessage(result.error instanceof Error ? result.error : null, mainError)
      );
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (validatedData: FormValues) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    logger.debug('Registration form submitted via hook', { email: validatedData.email });

    try {
      const formData = new FormData();
      formData.append('email', validatedData.email);
      formData.append('password', validatedData.password);

      const result = await registerUserAction(null, formData);
      processActionResult(result);
    } catch (err: unknown) {
      handleRegistrationSubmitError(err, setError, setSuccess);
    } finally {
      setIsSubmitting(false);
    }
  };

  useSuccessRedirectEffect(success, isSubmitting, router, updateSession);

  return {
    form,
    onSubmit,
    isPending: isSubmitting,
    error,
    success,
  };
}
