'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUserAction } from '@/lib/actions/auth.actions';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

export function useRegistrationForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    logger.debug('Registration form submitted via hook', { email: validatedData.email });
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('email', validatedData.email);
      formData.append('password', validatedData.password);

      const result = await registerUserAction(formData);

      setIsSubmitting(false);

      if (result.success) {
        setSuccess(result.message || 'Registration successful!');
        logger.info('Success result received, state updated.');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err: unknown) {
      logger.error('Registration form submission error in hook', { error: err });
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (success && !isSubmitting) {
      logger.info('useEffect detected success state, delaying redirect slightly...');
      timer = setTimeout(async () => {
        logger.info('Redirecting to /dashboard via router.push after delay.');
        router.push('/dashboard');
        logger.info('Forcing session update after redirect attempt...');
        await updateSession();
        logger.info('Session update forced.');
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, isSubmitting, router, updateSession]);

  return {
    form,
    onSubmit,
    isPending: isSubmitting,
    error,
    success,
  };
}
