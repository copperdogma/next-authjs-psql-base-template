'use client';

import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import NoSessionState from './NoSessionState';
import DashboardSections from './DashboardSections';

export default function DashboardContent(): React.ReactNode {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Add useEffect to log session status for debugging
  useEffect(() => {
    // Check for unauthenticated status to set an error message
    if (status === 'unauthenticated') {
      setError('Session not authenticated. Please log in again.');
    }
    // Clear error if status becomes authenticated or loading
    else if (status === 'authenticated' || status === 'loading') {
      setError(null);
    }
  }, [status]);

  // Loading state
  if (status === 'loading') {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // No session state
  if (!session?.user) {
    return <NoSessionState />;
  }

  return <DashboardSections session={session} />;
}
